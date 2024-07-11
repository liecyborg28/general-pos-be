const User = require("../models/userModel");
const BalanceTransaction = require("../models/balanceTransactionModel");
const pageController = require("./utils/pageController");
const userController = require("./userController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");
const Joi = require("joi");
const PaymentGatewayController = require('./utils/paymentGatewayController');
const midtransClient = require('midtrans-client');
const config = require('../config/config');

// Inisialisasi Midtrans
let snap = new midtransClient.Snap({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey
});

// Fungsi untuk konversi tanggal
function convertToLocaleISOString(date, type) {
  if (type !== "start" && type !== "end") {
    throw new Error('Parameter "type" harus "start" atau "end"');
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedTimestamp =
    type === "start"
      ? date.setHours(0, 0, 0, 0) - timezoneOffset
      : date.setHours(23, 59, 59, 999) - timezoneOffset;

  const adjustedDate = new Date(adjustedTimestamp);
  return adjustedDate.toISOString();
}

// Skema validasi untuk topUp
const topUpSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Jumlah top-up harus berupa angka',
    'number.positive': 'Jumlah top-up harus lebih besar dari 0',
    'any.required': 'Jumlah top-up harus diisi',
  }),
  customerName: Joi.string().required().messages({
    'string.base': 'Nama harus berupa teks',
    'any.required': 'Nama harus diisi',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email tidak valid',
    'any.required': 'Email harus diisi',
  }),
  phoneNumber: Joi.string().optional().allow(''),
});

module.exports = {
  // ... (perlu nambahin fungsi authenticateUser? dan fungsi lain yang ada)

  // Metode untuk top-up saldo menggunakan Midtrans
  topUp: async (req, res) => {
    try {
      const { error: validationError } = topUpSchema.validate(req.body);
      if (validationError) {
        return res.status(400).json({ message: validationError.details[0].message });
      }

      const { amount, customerName, email, phoneNumber } = req.body;

      const paymentResponse = await PaymentGatewayController.requestPaymentMidtrans({
        amount,
        invoiceNumber: `TOPUP-${Date.now()}`,
        customerName,
        email,
        phoneNumber,
      });

      const userByToken = await User.findOne({
        "auth.accessToken": req.headers.authorization.split(" ")[1],
      });

      const newBalanceTransaction = new BalanceTransaction({
        userId: userByToken._id,
        invoiceId: paymentResponse.orderId,
        status: "pending",
        amount: amount,
        fee: 0,
        paymentMethod: null,
        tag: "in",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await newBalanceTransaction.save();
      res.redirect(paymentResponse.paymentUrl);

    } catch (error) {
      console.error("Error during top-up:", error);
      res.status(500).json({ message: 'Gagal memproses top-up' });
    }
  },

  handleMidtransNotification: async (req, res) => {
    try {
      const notification = req.body;

      snap.transaction.notification(notification)
        .then(async (statusResponse) => {
          const orderId = statusResponse.order_id;
          const transactionStatus = statusResponse.transaction_status;
          const fraudStatus = statusResponse.fraud_status;

          let balanceTransaction = await BalanceTransaction.findOne({ invoiceId: orderId });
          if (!balanceTransaction) {
            return res.status(404).send("Transaksi tidak ditemukan");
          }

          if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') {
              balanceTransaction.status = 'challenge';
            } else if (fraudStatus == 'accept') {
              balanceTransaction.status = 'success';
            }
          } else if (transactionStatus == 'settlement') {
            balanceTransaction.status = 'success';
            balanceTransaction.paymentMethod = statusResponse.payment_type;
            balanceTransaction.fee = statusResponse.va_numbers
              ? statusResponse.va_numbers[0].bank_fee
              : 0;

            // Update saldo user
            if (balanceTransaction.status === 'success') {
              let user = await User.findById(balanceTransaction.userId);
              user.balance += balanceTransaction.amount;
              await user.save();
            }
          } else if (transactionStatus == 'pending') {
            balanceTransaction.status = 'pending';
          } else if (transactionStatus == 'deny' || transactionStatus == 'expire' || transactionStatus == 'cancel') {
            balanceTransaction.status = 'failed';
          }

          await balanceTransaction.save();

          res.status(200).send('Notification received');
        })
        .catch((e) => {
          console.log('Error processing notification:', e);
          res.status(400).send('Invalid notification');
        });
    } catch (error) {
      console.error("Error handling Midtrans notification:", error);
      res.status(500).send("Error processing notification");
    }
  },


  // Mengambil data transaksi berdasarkan periode
  getBalanceTransactionsByPeriod: async (req, res) => {
    try {
      const bearerHeader = req.headers["authorization"];
      const bearerToken = bearerHeader.split(" ")[1];

      let userByToken = await User.findOne({
        "auth.accessToken": bearerToken,
      });

      let pageKey = req.query.pageKey ? parseInt(req.query.pageKey) : 1;
      let pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;

      let defaultFrom = new Date();
      defaultFrom.setHours(0, 0, 0, 0);
      let defaultTo = new Date();
      defaultTo.setHours(23, 59, 59, 999);

      let pipeline = {
        userId: userByToken._id,
        createdAt: {
          $gte: req.query.from ? new Date(req.query.from) : defaultFrom,
          $lte: req.query.to ? new Date(req.query.to) : defaultTo,
        },
      };

      const transactions = await BalanceTransaction.find(pipeline)
        .sort({ createdAt: -1 })
        .skip((pageKey - 1) * pageSize)
        .limit(pageSize);

      const totalCount = await BalanceTransaction.countDocuments(pipeline);

      res.status(200).json({
        error: false,
        data: transactions,
        count: totalCount,
        currentPage: pageKey,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } catch (error) {
      console.error("Error getting transactions by period:", error);
      res.status(500).json({ message: "Gagal mengambil data transaksi" });
    }
  },

  // Mengupdate data transaksi
  updateBalanceTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { status, tag } = req.body;

      // 1. Validasi data input
      const { error: joiValidationError } = updateTransactionSchema.validate({ status, tag });
      if (joiValidationError) {
        return res.status(400).json({ message: joiValidationError.details[0].message });
      }

      // 2. Cari transaksi berdasarkan ID
      let balanceTransaction = await BalanceTransaction.findById(transactionId);
      if (!balanceTransaction) {
        return res.status(404).send("Transaksi tidak ditemukan");
      }
 // --- 1B. Contoh custom validation ---
      if (status === 'success' && !balanceTransaction.paymentMethod) {
        return res.status(400).json({ 
          message: "Tidak bisa mengubah status ke 'success' karena metode pembayaran belum tercatat." 
        });
      }

      // 3. Update data transaksi 
      balanceTransaction.status = status;
      balanceTransaction.tag = tag;

      await balanceTransaction.save();

      res.status(200).json({
        error: false,
        data: balanceTransaction,
        message: "Data transaksi berhasil diupdate",
      });

    } catch (error) {
      console.error("Error updating balance transaction:", error);
      res.status(500).json({ message: "Gagal mengupdate data transaksi" });
    }
  }

};
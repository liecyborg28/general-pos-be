// Perlu Revisi lagi?
const User = require("../models/userModel");
const BalanceTransaction = require("../models/balanceTransactionModel");
const PaymentGatewayController = require('./utils/paymentGatewayController');
const midtransClient = require('midtrans-client');
const Joi = require("joi");
const authenticateUser = require('../middleware/authMiddleware'); // Path ke authMiddleware
const config = require('../config/config');

// Inisialisasi Midtrans
let snap = new midtransClient.Snap({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey
});
// Fungsi untuk konversi tanggal ke format ISO lokal
function convertToLocaleISOString(date, type) {
  // Validasi parameter type
  if (type !== "start" && type !== "end") {
    throw new Error('Parameter "type" harus "start" atau "end"');
  }

  // Dapatkan offset timezone lokal dalam milidetik
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  // Hitung timestamp untuk awal atau akhir hari dengan menyesuaikan timezone
  const adjustedTimestamp =
    type === "start"
      ? date.setHours(0, 0, 0, 0) - timezoneOffset  
      : date.setHours(23, 59, 59, 999) - timezoneOffset; 

  // Buat objek Date baru dengan timestamp yang sudah disesuaikan
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
  phoneNumber: Joi.string().optional().allow(''), // Optional, boleh kosong
});

// Skema validasi untuk update transaksi
const updateTransactionSchema = Joi.object({
  status: Joi.string()
    .valid('success', 'pending', 'failed', 'challenge') // Daftar status valid
    .required(),
  tag: Joi.string().optional(),
});

module.exports = {
  topUp: [authenticateUser, async (req, res) => {
    try {
      // 1. Validasi data input
      const { error: validationError } = topUpSchema.validate(req.body);
      if (validationError) {
        return res.status(400).json({ message: validationError.details[0].message });
      }

      const { amount, customerName, email, phoneNumber } = req.body;

      // 2. Request pembayaran ke Midtrans
      const paymentResponse = await PaymentGatewayController.requestPaymentMidtrans({
        amount,
        invoiceNumber: `TOPUP-${Date.now()}`,
        customerName,
        email,
        phoneNumber,
      });

      // 3. Ambil data user dari req.user (di-set oleh middleware)
      const user = req.user;

      // 4. Buat transaksi baru
      const newBalanceTransaction = new BalanceTransaction({
        userId: user._id,
        invoiceId: paymentResponse.orderId,
        status: "pending",
        amount,
        fee: 0,
        paymentMethod: null,
        tag: "in",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await newBalanceTransaction.save();

      // 5. Redirect ke halaman pembayaran Midtrans
      res.redirect(paymentResponse.paymentUrl);

    } catch (error) {
      console.error("Error during top-up:", error);
      res.status(500).json({
        message: 'Gagal memproses top-up',
        details: error.message
      });
    }
  }],

  handleMidtransNotification: [authenticateUser, async (req, res) => {
    try {
      const notification = req.body;

      snap.transaction.notification(notification)
        .then(async (statusResponse) => {
          const orderId = statusResponse.order_id;
          const transactionStatus = statusResponse.transaction_status;
          const fraudStatus = statusResponse.fraud_status;

          let balanceTransaction = await BalanceTransaction.findOne({ invoiceId: orderId });
          if (!balanceTransaction) {
            console.error("Transaksi tidak ditemukan:", orderId);
            return res.status(404).send("Transaksi tidak ditemukan");
          }

          // Update status dan informasi transaksi
          if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
              balanceTransaction.status = 'challenge';
            } else if (fraudStatus === 'accept') {
              balanceTransaction.status = 'success';
            }
          } else if (transactionStatus === 'settlement') {
            balanceTransaction.status = 'success';
            balanceTransaction.paymentMethod = statusResponse.payment_type;
            balanceTransaction.fee = statusResponse.va_numbers
              ? statusResponse.va_numbers[0].bank_fee
              : 0;

            // Update saldo user
            await updateUserBalance(balanceTransaction.userId, balanceTransaction.amount);
          } else if (transactionStatus === 'pending') {
            balanceTransaction.status = 'pending';
          } else if (
            transactionStatus === 'deny' ||
            transactionStatus === 'expire' ||
            transactionStatus === 'cancel'
          ) {
            balanceTransaction.status = 'failed';
          }

          await balanceTransaction.save();

          res.status(200).send('Notification received');
        })
        .catch((error) => {
          console.log('Error processing notification:', error);
          res.status(400).send('Invalid notification');
        });
    } catch (error) {
      console.error("Error handling Midtrans notification:", error);
      res.status(500).send("Error processing notification");
    }
  }],

  getBalanceTransactionsByPeriod: [authenticateUser, async (req, res) => {
    try {
      const user = req.user; // Ambil data user dari req.user
      let pageKey = req.query.pageKey ? parseInt(req.query.pageKey) : 1;
      let pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;

      let defaultFrom = new Date();
      defaultFrom.setHours(0, 0, 0, 0);
      let defaultTo = new Date();
      defaultTo.setHours(23, 59, 59, 999);

      let pipeline = {
        userId: user._id, // Gunakan user._id dari req.user
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
  }],

  updateBalanceTransaction: [authenticateUser, async (req, res) => {
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

      // 3. Validasi tambahan
      if (status === 'success' && !balanceTransaction.paymentMethod) {
        return res.status(400).json({
          message: "Tidak bisa mengubah status ke 'success' karena metode pembayaran belum tercatat."
        });
      }

      // 4. Update data transaksi
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
  }]
};

// Fungsi helper untuk update saldo user
async function updateUserBalance(userId, amount) {
  try {
    let user = await User.findById(userId);
    user.balance += amount;
    await user.save();
  } catch (error) {
    console.error("Error saat mengupdate saldo user:", error);
    // Contoh: Kirim notifikasi ke admin, catat error ke log file, dll. 
  }
}

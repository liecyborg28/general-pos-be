// Perlu Revisi lagi?
const User = require("../models/userModel");
const BalanceTransaction = require("../models/balanceTransactionModel");
const PaymentGatewayController = require('./utils/paymentGatewayController');
const midtransClient = require('midtrans-client');
const Joi = require("joi");
const authenticateUser = require('./authMiddleware');
const config = require('../config/config');

// Inisialisasi Midtrans
// Ambil konfigurasi dari config.js
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
  // Metode untuk top-up saldo menggunakan Midtrans
  topUp: [authenticateUser, async (request, response) => { // Menggunakan authenticateUser sebagai middleware
    try {
      const { error: validationError } = topUpSchema.validate(request.body);
      if (validationError) {
         return response.status(400).json({ message: validationError.details[0].message });
      }

     
      const { amount, customerName, email, phoneNumber } = request.body;

      // Meminta token dan URL pembayaran dari Midtrans
      const paymentResponse = await PaymentGatewayController.requestPaymentMidtrans({
        amount: amount,
        invoiceNumber: `TOPUP-${Date.now()}`, // Generate nomor invoice unik
        customerName: customerName,
        email: email,
        phoneNumber: phoneNumber,
      });

      // Ambil data user dari request object (sudah di-set oleh middleware authenticateUser)
      const userByToken = request.user;

      // Buat objek transaksi baru
      const newBalanceTransaction = new BalanceTransaction({
        userId: userByToken._id,             // ID user
        invoiceId: paymentResponse.orderId,  // ID order dari Midtrans
        status: "pending",                  // Status awal transaksi
        amount: amount,                    // Jumlah top-up
        fee: 0,                            // Fee akan diupdate setelah pembayaran berhasil
        paymentMethod: null,                // Metode pembayaran akan diupdate setelah pembayaran berhasil
        tag: "in",                         // Tag transaksi
        createdAt: new Date().toISOString(), // Tanggal pembuatan transaksi
        updatedAt: new Date().toISOString(), // Tanggal update transaksi
      });

      // Simpan transaksi ke database
      await newBalanceTransaction.save();
      // Redirect user ke halaman pembayaran Midtrans
      response.redirect(paymentResponse.paymentUrl);

    } catch (error) {
      console.error("Error saat memproses top-up:", error); // Log error ke console
      // Kembalikan response error 500 dengan pesan error
      response.status(500).json({ 
        message: 'Gagal memproses top-up', 
        details: error.message 
      });
    }
  }],

  // Endpoint untuk menerima notifikasi dari Midtrans
  handleMidtransNotification: [authenticateUser, async (request, response) => { 
    try {
      const notification = request.body;
      snap.transaction.notification(notification)
        .then(async (statusResponse) => {
          // Ambil data dari response Midtrans
          const orderId = statusResponse.order_id;
          const transactionStatus = statusResponse.transaction_status;
          const fraudStatus = statusResponse.fraud_status;

          // Cari transaksi di database berdasarkan orderId
          let balanceTransaction = await BalanceTransaction.findOne({ invoiceId: orderId });
          // Jika transaksi tidak ditemukan, kembalikan response error 404
          if (!balanceTransaction) {
            console.error("Transaksi tidak ditemukan:", orderId);
            return response.status(404).send("Transaksi tidak ditemukan");
          }

          // Update status transaksi berdasarkan response Midtrans
          if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
              balanceTransaction.status = 'challenge'; // Status challenge
            } else if (fraudStatus === 'accept') {
              balanceTransaction.status = 'success';   // Status sukses
            }
          } else if (transactionStatus === 'settlement') {
            balanceTransaction.status = 'success'; // Status sukses
            balanceTransaction.paymentMethod = statusResponse.payment_type; // Update metode pembayaran
            // Update fee jika ada
            balanceTransaction.fee = statusResponse.va_numbers
              ? statusResponse.va_numbers[0].bank_fee
              : 0;

            // Jika status transaksi sukses, update saldo user
            if (balanceTransaction.status === 'success') {
              // Panggil fungsi helper untuk update saldo user
              await updateUserBalance(balanceTransaction.userId, balanceTransaction.amount);
            }
          } else if (transactionStatus === 'pending') {
            balanceTransaction.status = 'pending'; // Status pending
          } else if (transactionStatus === 'deny' || transactionStatus === 'expire' || transactionStatus === 'cancel') {
            balanceTransaction.status = 'failed'; // Status gagal
          }

          // Simpan update transaksi ke database
          await balanceTransaction.save();

          // Kirim response sukses ke Midtrans
          response.status(200).send('Notification received');
        })
        .catch((error) => {
          // Tangani error dari Midtrans
          console.log('Error saat memproses notifikasi:', error);
          response.status(400).send('Invalid notification');
        });
    } catch (error) {
      // Tangani error server
      console.error("Error saat menangani notifikasi Midtrans:", error);
      response.status(500).send("Error processing notification");
    }
  }],

  // Mendapatkan data transaksi berdasarkan periode waktu
  getBalanceTransactionsByPeriod: [authenticateUser, async (request, response) => {
    try {
      // Ambil data user dari request object (sudah di-set oleh middleware)
      const userByToken = request.user;
      // Ambil parameter pagination dari query string
      let pageKey = request.query.pageKey ? parseInt(request.query.pageKey) : 1;
      let pageSize = request.query.pageSize ? parseInt(request.query.pageSize) : 10;
      // Tentukan tanggal default (awal dan akhir hari ini)
      let defaultFrom = new Date();
      defaultFrom.setHours(0, 0, 0, 0); // Awal hari
      let defaultTo = new Date();
      defaultTo.setHours(23, 59, 59, 999); // Akhir hari

      // Buat filter untuk query database
      let pipeline = {
        userId: userByToken._id, // Filter berdasarkan userId
        createdAt: {
          $gte: request.query.from ? new Date(request.query.from) : defaultFrom, // Tanggal awal
          $lte: request.query.to ? new Date(request.query.to) : defaultTo,       // Tanggal akhir
        },
      };

      // Query database untuk mendapatkan transaksi dengan pagination
      const transactions = await BalanceTransaction.find(pipeline)
        .sort({ createdAt: -1 })
        .skip((pageKey - 1) * pageSize)
        .limit(pageSize); 

      // Hitung total transaksi yang sesuai filter
      const totalCount = await BalanceTransaction.countDocuments(pipeline);
      // Kembalikan response dengan data transaksi, pagination, dan total data
      response.status(200).json({
        error: false,
        data: transactions,
        count: totalCount,
        currentPage: pageKey,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } catch (error) {
      // Tangani error jika terjadi kesalahan
      console.error("Error saat mengambil transaksi berdasarkan periode:", error);
      response.status(500).json({ message: "Gagal mengambil data transaksi" });
    }
  }],

  // Mengupdate data transaksi
  updateBalanceTransaction: [authenticateUser, async (request, response) => {
    try {
      const { transactionId } = request.params;
      const { status, tag } = request.body;

      // Validasi data input
      const { error: joiValidationError } = updateTransactionSchema.validate({ status, tag });
      if (joiValidationError) {
        // Jika validasi gagal, kembalikan response error 400
        return response.status(400).json({ message: joiValidationError.details[0].message });
      }

      // Cari transaksi berdasarkan ID
      let balanceTransaction = await BalanceTransaction.findById(transactionId);
      if (!balanceTransaction) {
        console.error("Transaksi tidak ditemukan:", transactionId);
        return response.status(404).send("Transaksi tidak ditemukan");
      }

      // Validasi tambahan: Pastikan metode pembayaran tercatat sebelum mengubah status ke 'success'
      if (status === 'success' && !balanceTransaction.paymentMethod) {
        return response.status(400).json({
          message: "Tidak bisa mengubah status ke 'success' karena metode pembayaran belum tercatat."
        });
      }

      // Update data transaksi
      balanceTransaction.status = status;
      balanceTransaction.tag = tag;
      await balanceTransaction.save();

      // Kembalikan response sukses
      response.status(200).json({
        error: false,
        data: balanceTransaction,
        message: "Data transaksi berhasil diupdate",
      });

    } catch (error) {
      // Tangani error jika terjadi kesalahan
      console.error("Error saat mengupdate data transaksi:", error);
      response.status(500).json({ message: "Gagal mengupdate data transaksi" });
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

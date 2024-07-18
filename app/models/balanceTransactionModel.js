const mongoose = require('mongoose');

const balanceTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceId: {
    type: String,
    required: false,
    unique: true // Menambahkan unique index untuk mencegah duplikat invoiceId
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'challenge', 'expire'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String 
  },
  tag: {
    type: String 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BalanceTransaction', balanceTransactionSchema);
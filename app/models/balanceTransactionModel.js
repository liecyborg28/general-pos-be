const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const BalanceTransaction = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tag: String,
  invoiceId: String,
  status: String,
  amount: Number,
  note: String,
  fee: Number,
  paymentMethod: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("BalanceTransaction", BalanceTransaction);

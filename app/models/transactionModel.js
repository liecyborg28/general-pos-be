const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Transaction = mongoose.Schema({
  status: String,
  orderStatus: String,
  tax: Number,
  charge: Number,
  table: String,
  paymentType: String,
  orderType: String,
  request: {
    status: String,
    viewCode: Number,
    valueCode: Number,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  customer: String,
  costs: [{ title: String, cost: Number }],
  details: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
      qty: Number,
      price: Number,
    },
  ],
  changeLog: [],
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Transaction", Transaction);

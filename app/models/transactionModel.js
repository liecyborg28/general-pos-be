const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Transaction = mongoose.Schema({
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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  discounts: [{ title: String, amount: Number }],
  costs: [{ title: String, amount: Number }],
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
  request: {
    status: String,
    viewCode: Number,
    valueCode: Number,
  },
  changeLog: [],
  status: String,
  orderStatus: String,
  tax: Number,
  charge: Number,
  table: String,
  floor: String,
  paymentAmount: Number,
  paymentMethod: String,
  orderType: String,
  customer: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Transaction", Transaction);

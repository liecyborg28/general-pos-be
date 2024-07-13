const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const PoolTableTransaction = mongoose.Schema({
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
      poolTableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PoolTable",
      },
      poolTableNumber: String,
      poolTableFloor: Number,
      duration: String,
      durationType: String,
      price: Number,
    },
  ],
  scheduledAt: String,
  status: String,
  tax: Number,
  charge: Number,
  paymentMethod: String,
  paymentAmount: String,
  customer: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("PoolTableTransaction", PoolTableTransaction);

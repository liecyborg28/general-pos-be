const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Transaction = mongoose.Schema({
  amount: Number,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  charge: Number,
  costs: [{ title: String, amount: Number }],
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  details: [
    {
      extras: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
          inventoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
          },
          qty: Number,
          price: Number,
        },
      ],
      note: String,
      price: Number,
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      qty: Number,
    },
  ],
  offers: [{ title: String, amount: Number }],
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  request: {
    status: String,
    viewCode: Number,
    valueCode: Number,
  },
  status: {
    order: String,
    payment: String,
  },
  method: String,
  note: String,
  tax: Number,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Transaction", Transaction);

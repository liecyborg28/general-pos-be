const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Transaction = mongoose.Schema({
  amount: Number,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  charges: [{ title: String, amount: Number }],
  details: [
    {
      additionals: [
        {
          cost: Number,
          price: Number,
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
        },
      ],
      cost: Number,
      price: Number,
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  ],
  promotions: [
    {
      amount: Number,
      promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
      },
    },
  ],
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

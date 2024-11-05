const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const PurchaseOrder = mongoose.Schema({
  amount: Number,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  details: [
    // {
    //   componentId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Component",
    //   },
    //   price: Number,
    //   qty: Number,
    // },
  ],
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentMethod",
  },
  status: {
    order: String,
    payment: String,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
  },
  taxes: [
    // {
    //   amount: Number,
    //   taxId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Tax",
    //   },
    //   type: String,
    // },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("PurchaseOrder", PurchaseOrder);

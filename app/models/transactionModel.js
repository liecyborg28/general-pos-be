const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Transaction = mongoose.Schema({
  // Jumlah yang dibayarkan
  amount: Number,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  charges: [
    // {
    //   amount: Number,
    //   chargeId: String,
    //   chargeId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Charge",
    //   },
    //   type: String,
    // },
  ],
  details: [
    // {
    //   additionals: [
    //     {
    //       components: [
    //         {
    //           componentId: {
    //             type: mongoose.Schema.Types.ObjectId,
    //             ref: "Component",
    //           },
    //           qty: Number,
    //         },
    //       ],
    //       cost: Number,
    //       price: Number,
    //       productId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "Product",
    //       },
    //     },
    //   ],
    //   components: [
    //     {
    //       componentId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "Component",
    //       },
    //       qty: Number,
    //     },
    //   ],
    //   cost: Number,
    //   note: String,
    //   price: Number,
    //   productId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Product",
    //   },
    //   qty: Number,
    // },
  ],
  note: String,
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentMethod",
  },
  promotions: [
    // {
    //   amount: Number,
    //   promotionId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Promotion",
    //   },
    //   type: String,
    // },
  ],
  request: {
    status: String,
    viewCode: Number,
    valueCode: Number,
  },
  status: {
    order: String,
    payment: String,
  },
  serviceMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceMethod",
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
  tips: [
    {
      amount: Number,
      name: String,
      note: String,
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Transaction", Transaction);

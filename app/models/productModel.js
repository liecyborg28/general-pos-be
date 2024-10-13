const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Product = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cost: Number,
  countable: Boolean,
  charged: Boolean,
  imageUrl: String,
  ingredients: [
    {
      inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
      },
      qty: Number,
    },
  ],
  name: String,
  price: Number,
  qty: Number,
  status: String,
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
  },
  qty: {
    current: Number,
    last: Number,
    status: String,
    max: Number,
    min: Number,
  },
  taxed: Boolean,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Product", Product);

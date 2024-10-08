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
  ingredients: [
    {
      inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
      },
      qty: Number,
    },
  ],
  taxed: Boolean,
  charged: Boolean,
  status: String,
  name: String,
  imageUrl: String,
  cost: Number,
  price: Number,
  qty: Number,
  countable: Boolean,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Product", Product);

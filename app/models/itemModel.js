const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Item = mongoose.Schema({
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
  // changeLog: [],
  taxed: Boolean,
  charged: Boolean,
  status: String,
  name: String,
  imageUrl: String,
  price: Number,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Item", Item);

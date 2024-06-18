const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const PoolTable = mongoose.Schema({
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
  type: String,
  taxed: Boolean,
  charged: Boolean,
  status: String,
  name: String,
  price: Number,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("PoolTable", PoolTable);

const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const PoolTable = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  // categoryId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Category",
  // },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: String,
  status: String,
  name: String,
  price: Number,
  taxed: Boolean,
  charged: Boolean,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("PoolTable", PoolTable);

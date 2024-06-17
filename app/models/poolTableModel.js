const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const PoolTable = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  taxed: Boolean,
  charged: Boolean,
  status: String,
  name: String,
  price: Number,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("PoolTable", PoolTable);

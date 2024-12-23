const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Currency = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  decimal: String,
  name: String,
  separator: String,
  status: String,
  symbol: String,
  totalDecimal: Number,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Currency", Currency);

const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Customer = mongoose.Schema({
  auth: {},
  balance: Number,
  email: String,
  imageUrl: String,
  name: String,
  phone: String,
  point: String,
  status: String,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Customer", Customer);

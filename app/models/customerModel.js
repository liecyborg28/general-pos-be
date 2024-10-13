const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Customer = mongoose.Schema({
  auth: {},
  balance: Number,
  email: String,
  gender: String,
  imageUrl: String,
  name: String,
  password: String,
  phone: String,
  point: String,
  settings: {
    theme: String,
    language: String,
  },
  status: String,
  username: String,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Customer", Customer);

const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Customer = mongoose.Schema({
  auth: {},
  balance: Number,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  email: String,
  imageUrl: String,
  name: String,
  phone: String,
  point: Number,
  status: String,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Customer", Customer);

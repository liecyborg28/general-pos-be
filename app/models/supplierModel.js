const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Supplier = mongoose.Schema({
  auth: {},
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  email: String,
  imageUrl: String,
  name: String,
  phone: String,
  status: String,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Supplier", Supplier);

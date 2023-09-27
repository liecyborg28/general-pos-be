const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const User = mongoose.Schema({
  type: String,
  status: String,
  imageUrl: String,
  gender: String,
  email: String,
  phonenumber: String,
  name: String,
  username: String,
  password: String,
  createdAt: String,
  updatedAt: String,
  businessId: [],
  access: [],
  outletId: [],
  auth: {},
});

module.exports = mongoose.model("User", User);

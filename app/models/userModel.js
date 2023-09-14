const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/test");

const User = mongoose.Schema({
  type: String,
  imageUrl: String,
  gender: String,
  email: String,
  phonenumber: String,
  name: String,
  username: String,
  password: String,
  businessId: [],
  access: [],
  outletId: [],
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("User", User);

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
  createdAt: String,
  updatedAt: String,
  businessId: [],
  access: [],
  outletId: [],
  auth: {},
});

User.index({
  type: "text",
  name: "text",
  username: "text",
  gender: "text",
  phonenumber: "text",
});

module.exports = mongoose.model("User", User);

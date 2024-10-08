const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const User = mongoose.Schema({
  auth: {},
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  email: String,
  gender: String,
  imageUrl: String,
  name: String,
  password: String,
  phone: String,
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
  },
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

module.exports = mongoose.model("User", User);

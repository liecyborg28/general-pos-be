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
  businessIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },
  ],
  outletIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Outlet",
    },
  ],
  access: [],
  auth: {},
});

module.exports = mongoose.model("User", User);

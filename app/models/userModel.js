const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const User = mongoose.Schema({
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
});

module.exports = mongoose.model("User", User);

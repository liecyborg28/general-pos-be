const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Outlet = mongoose.Schema({
  status: String,
  businessId: String,
  name: String,
  address: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Outlet", Outlet);

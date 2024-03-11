const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Log = mongoose.Schema({
  createdAt: String,
  title: String,
  note: String,
  type: String,
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref:
      "Business" ||
      "Category" ||
      "Inventory" ||
      "Item" ||
      "Offer" ||
      "Outlet" ||
      "Transaction" ||
      "User",
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  data: {},
});

module.exports = mongoose.model("Log", Log);

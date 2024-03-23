const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Inventory = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  status: String,
  name: String,
  qty: {
    status: String,
    early: Number,
    last: Number,
    min: Number,
    max: Number,
  },
  denomination: String,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: String,
  uodatedAt: String,
});

module.exports = mongoose.model("Inventory", Inventory);

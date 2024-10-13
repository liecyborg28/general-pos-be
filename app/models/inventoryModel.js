const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Inventory = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
  },
  imageUrl: String,
  name: String,
  status: String,
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlet",
  },
  qty: {
    current: Number,
    last: Number,
    status: String,
    max: Number,
    min: Number,
  },
  createdAt: String,
  uodatedAt: String,
});

module.exports = mongoose.model("Inventory", Inventory);

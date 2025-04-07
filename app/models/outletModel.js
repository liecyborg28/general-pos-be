const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Outlet = mongoose.Schema({
  address: String,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
  },
  name: String,
  note: String,
  status: String,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Outlet", Outlet);

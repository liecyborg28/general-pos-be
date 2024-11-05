const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Component = mongoose.Schema({
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
  imageUrl: String,
  name: String,
  status: String,
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
  },
  qty: {
    current: Number,
    max: Number,
    min: Number,
    status: String,
  },
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Component", Component);

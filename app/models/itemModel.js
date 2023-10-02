const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Item = mongoose.Schema({
  status: String,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  name: String,
  imageUrl: String,
  price: String,
  changeLog: [],
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Item", Item);

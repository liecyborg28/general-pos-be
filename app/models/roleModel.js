const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Role = mongoose.Schema({
  access: [],
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  title: String,
  status: String,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Role", Role);

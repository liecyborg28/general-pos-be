const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Business = mongoose.Schema({
  imageUrl: String,
  name: String,
  note: String,
  status: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Business", Business);

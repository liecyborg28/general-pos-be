const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Business = mongoose.Schema({
  userIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: String,
  imageUrl: String,
  name: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Business", Business);

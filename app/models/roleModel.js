const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Role = mongoose.Schema({
  businessIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },
  ],
  access: [],
  title: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Role", Role);

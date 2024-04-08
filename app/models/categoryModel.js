const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Category = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  type: String,
  subtype: String,
  name: String,
  status: String,
});

module.exports = mongoose.model("Category", Category);

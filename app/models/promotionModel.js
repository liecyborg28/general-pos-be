const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Promotion = mongoose.Schema({
  amount: Number,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  title: String,
  type: String,
});

module.exports = mongoose.model("Promotion", Promotion);

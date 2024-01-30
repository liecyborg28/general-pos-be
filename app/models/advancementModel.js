const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Advancement = mongoose.Schema({
  title: String,
  type: String,
  amount: Number,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
});

module.exports = mongoose.model("Advancement", Advancement);

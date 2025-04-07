const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Product = mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  categoryIds: [],
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  code: {
    bar: String,
    qr: String,
  },
  countable: Boolean,
  name: String,
  status: String,
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
  },
  variants: [
    {
      components: [
        {
          componentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Component",
          },
          qty: Number,
        },
      ],
      cost: Number,
      description: String,
      default: Boolean,
      imageUrl: String,
      name: String,
      price: Number,
      // qty: Number,
    },
  ],
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Product", Product);

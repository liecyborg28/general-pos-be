const mongoose = require("mongoose");

const dbConfig = require("../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Product = mongoose.Schema({
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
  countable: Boolean,
  charged: Boolean,
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
      imageUrl: String,
      name: String,
      price: Number,
      qty: Number,
    },
  ],
  status: String,
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
  },
  qty: {
    current: Number,
    last: Number,
    status: String,
    max: Number,
    min: Number,
  },
  taxed: Boolean,
  // timestamp
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Product", Product);

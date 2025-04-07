const mongoose = require("mongoose");

const dbConfig = require("./../../config/dbConfig");

mongoose.connect(dbConfig.url);

const Warehouse = mongoose.Schema({
  name: String,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  components: [
    {
      componentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Component",
      },
      qty: {
        current: Number,
        max: Number,
        min: Number,
        status: String,
      },
    },
  ],
  products: [
    {
      productId: String,
      qty: Number,
      variants: [
        {
          variantId: String,
          qty: Number,
        },
      ],
    },
  ],
  status: String,
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("Warehouse", Warehouse);

const mongoose = require("mongoose");

const uomDetailSchema = new mongoose.Schema({
  bUom: String,
  bQty: Number,
  wUom: String,
  wQty: Number,
  isBuom: {
    type: Boolean,
    default: false,
  },
});

const itemSchema = new mongoose.Schema(
  {
    itemCode: String,
    itemName: String,
    itemGroup: String,
    itemTypes: String,
    category: String,

    // Header UOM
    uom: String,

    // UOM Detail Grid
    uomDetails: [uomDetailSchema],

    hsn: String,
    gstPercent: Number,
    grade: String,
    size: String,

    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
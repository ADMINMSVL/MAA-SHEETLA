const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    itemCode: { type: String },
    itemName: { type: String },
    category: { type: String },
    uom: { type: String },
    hsn: { type: String },
    gstPercent: { type: Number },
    grade: { type: String },
    size: { type: String },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
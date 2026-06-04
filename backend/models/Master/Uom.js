const mongoose = require("mongoose");

const uomSchema = new mongoose.Schema(
  {
    stockUOM: { type: String },
    purchaseUOM: { type: String },
    salesUOM: { type: String },
    conversionFactor: { type: Number },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UOM", uomSchema);
const mongoose = require("mongoose");

const taxDetailsSchema = new mongoose.Schema(
  {
    hsnCode: { type: String, required: true },
    gstPercent: { type: Number, required: true },
    description: { type: String },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxDetails", taxDetailsSchema);
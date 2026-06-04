const mongoose = require("mongoose");

const itemTypeSchema = new mongoose.Schema(
  {
    typeName: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemType", itemTypeSchema);
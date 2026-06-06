const mongoose = require("mongoose");

const itemTypeSchema = new mongoose.Schema(
  {
    itemGroup:   { type: String, required: true },
    itemTypes:   { type: String },
    description: { type: String },
    status:      { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemType", itemTypeSchema);
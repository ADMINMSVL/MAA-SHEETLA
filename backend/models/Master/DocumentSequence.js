const mongoose = require("mongoose");

const documentSequenceSchema = new mongoose.Schema(
  {
    module:              { type: String },
    businessEntity:      { type: String },
    entityPrefix:        { type: String },
    transactionCategory: { type: String },
    sequenceFormat:      { type: String },
    useDateFragment:     { type: Boolean, default: true },

    // How many digits the running number should be padded to (e.g. 2 → "01", 4 → "0001")
    sequenceDigits:      { type: Number, default: 2 },

    incrementNo:         { type: Number, default: 1 },
    generatedCode:       { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DocumentSequence", documentSequenceSchema);

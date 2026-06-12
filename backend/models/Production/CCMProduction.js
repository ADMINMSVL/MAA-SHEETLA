const mongoose = require("mongoose");

/* Input Materials */
const ccmInputSchema = new mongoose.Schema(
  {
    sNo: {
      type: Number,
    },

    material: {
      type: String,
      required: true,
      default: "Liquid Steel",
    },

    heatQty: {
      type: Number,
      required: true,
      default: 0,
    },

    uom: {
      type: String,
      default: "MT",
    },
  },
  { _id: false }
);

/* Billet Outputs */
const ccmOutputSchema = new mongoose.Schema(
  {
    sNo: {
      type: Number,
    },

    billetSize: {
      type: String,
      required: true,
    },

    grade: {
      type: String,
      required: true,
    },

    qty: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const ccmProductionSchema = new mongoose.Schema(
  {
    /* Header */

    ccmNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    ccmDate: {
      type: String,
      required: true,
    },

    shift: {
      type: String,
      enum: ["A", "B", "C"],
      default: "A",
    },

    heatNo: {
      type: String,
      required: true,
      trim: true,
    },

    site: {
      type: String,
      required: true,
    },

    furnaceNo: {
      type: String,
      trim: true,
    },

    operator: {
      type: String,
      trim: true,
    },

    remarks: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Open", "Draft", "Closed"],
      default: "Open",
    },

    /* Child Tables */

    inputs: {
      type: [ccmInputSchema],
      default: [],
    },

    outputs: {
      type: [ccmOutputSchema],
      default: [],
    },

    /* Totals */

    inputQty: {
      type: Number,
      default: 0,
    },

    totalBilletQty: {
      type: Number,
      default: 0,
    },

    scrapQty: {
      type: Number,
      default: 0,
    },

    rejectionQty: {
      type: Number,
      default: 0,
    },

    totalLossQty: {
      type: Number,
      default: 0,
    },

    yieldPct: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CCMProduction",
  ccmProductionSchema
);
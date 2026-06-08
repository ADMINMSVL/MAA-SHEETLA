const mongoose = require("mongoose");

/* ── Item sub-schema ── */
const ginItemSchema = new mongoose.Schema({
  sNo:       Number,
  itemCode:  String,
  itemName:  String,
  uom:       String,
  qty:       Number,
  rate:      { type: Number, default: 0 },   // rate fetched from PO item
}, { _id: false });

const goodsInwardNoteSchema = new mongoose.Schema({

  /* ── Core / Number ── */
  ginNo:               { type: String, required: true },
  inOutDescription:    String,   // IN/OUT Description
  inOutType:           String,   // "Inward" | "Outward"

  /* ── PO Reference ── */
  poCpoNo:             String,

  /* ── Date ── */
  ginDate:             String,

  /* ── Party ── */
  partyCode:           String,
  partyName:           String,
  partyDoc:            String,   // Party document reference

  /* ── Manufacturer ── */
  manufacturerName:    String,
  manufacturerAddress: String,

  /* ── Status ── */
  status:              { type: String, default: "Open" },  // "Open" | "Closed"

  /* ── Challan / Vehicle ── */
  challanInvoiceNo:    String,
  challanDate:         String,
  vehicleNo:           String,

  /* ── Notes ── */
  remarks:             String,

  /* ── Site ── */
  site:                String,

  /* ── Legacy / kept for backward compat ── */
  transactionCategory: String,
  ginDescription:      String,
  ginType:             String,
  deliveryMode:        String,
  vendorCode:          String,
  vendorName:          String,
  manufacturerCode:    String,
  vehicleEntry:        String,
  billNo:              String,
  billDate:            String,
  ewayDate:            String,
  comments:            String,

  /* ── Items grid ── */
  items: [ginItemSchema],

}, { timestamps: true });

module.exports = mongoose.model("GoodsInwardNote", goodsInwardNoteSchema);
const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema({
  sNo:          { type: Number },
  itemCode:     { type: String },
  itemCategory: { type: String },
  itemName:     { type: String },
  uom:          { type: String },
  qty:          { type: Number },
  rate:         { type: Number },
  basicAmount:  { type: Number },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNo:        { type: String },
    poDate:      { type: String },
    partyName:   { type: String },
    partyCode:   { type: String },
    mobileNo:    { type: String },
    transactionType:   { type: String },
    paymentMode: { type: String },
    eta:         { type: String },
    dueDate:     { type: String },
    status:      { type: String, default: "Ordered" },
    remarks:     { type: String },
    basicAmount: { type: Number },
    items:       [poItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
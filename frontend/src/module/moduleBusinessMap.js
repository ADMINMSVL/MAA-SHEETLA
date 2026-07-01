export const MODULE_BUSINESS_MAP = {

  /* ══ MFG ══ */
  "Procurement": [
    // "REQ.",
    "PO",
  ],

  "Inventory": [
    "Inward/Outward",
    "Weighment",
    "GRN",
    // "Quality",
    "Item Conversion"
  ],

  "Production": [
    "CCM",
    "Rolling",
    "Bundling",
  ],

  "Sales": [
    "Sales Contract",
    "Sales Order",
    "Outward",
    "Weighment",
    "Sales Shipment",
    "Sales Invoice",
    "Sales Return",
  ],

  "Master": [
    "Party",
    "Item/Service",
    "Scheme",
    "Charges",
    "Discount",
    "Transaction Cat.",
    "Doc Sequence",
    "Site Master",
  ],

  /* ══ FnA ══ */
  "General Ledger": [
    "Calendar Period",
    "COA",
    "Ledger",
    "Party to Party Transfer",
    "JV",
  ],

  "Acc. Payable": [
    "Purchase Voucher",
    "Payment Voucher",
    "Debit Note",
    "Credit Note",
    "Pay & Our Tag/Untag",
  ],

  "Acc. Receivable": [
    "Receipt Voucher",
    "Credit Note",
    "Sales Inv & Receipt Tagging",
  ],

};

/* Flat array of module names */
export const MODULES = Object.keys(MODULE_BUSINESS_MAP);

/* Solution grouping */
export const SOLUTION_MAP = {
  MFG: ["Procurement", "Inventory", "Production", "Sales", "Master"],
  FnA: ["General Ledger", "Acc. Payable", "Acc. Receivable"],
};
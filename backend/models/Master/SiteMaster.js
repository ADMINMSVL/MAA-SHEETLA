const mongoose = require("mongoose");

const siteMasterSchema = new mongoose.Schema(
  {
    /* ── CLASSIFICATION ── */
    module: {
      type: String,
      required: true,
    },

    businessEntity: {
      type: String,
      required: true,
    },

    /* ── IDENTITY ── */
    siteCode: {
      type: String,
      required: true,
      unique: true,
    },

    siteName: {
      type: String,
      required: true,
    },

    /* ── ADDRESS ── */
    address: {
      type: String,
    },

    city: {
      type: String,
    },

    state: {
      type: String,
    },

    pinCode: {
      type: String,
    },

    /* ── CONTACT ── */
    contactPerson: {
      type: String,
    },

    mobile: {
      type: String,
    },

    /* ── TAX ── */
    gstNo: {
      type: String,
    },

    /* ── LIFECYCLE ── */
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteMaster", siteMasterSchema);
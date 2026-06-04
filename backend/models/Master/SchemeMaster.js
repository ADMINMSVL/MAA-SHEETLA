const mongoose = require("mongoose");

/*
  SCHEME LOGIC (if BASIC = X):
  -----------------------------------------------
  SIZE | RAIPUR      | RAIPUR BASIC | FOR 12MM
  -----|-------------|--------------|----------
   8   | X + 2000    | X + 2000     | X + 3540
  10   | X           | X            | X + 2360
  12   | X           | X            | X
  16   | X           | X            | X + 1180
  20   | X           | X            | X + 1180
  25   | X           | X            | X + 1180
  -----------------------------------------------

  We store basicPrice (X) and the offsets are hardcoded in logic.
  computed price = basicPrice + offset
*/

const schemeMasterSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: true,
    },

    basicPrice: {
      type: Number,
      required: true,
    },

    /* Computed prices stored for reference */
    prices: {
      size8:  { raipur: Number, raipurBasic: Number, for12mm: Number },
      size10: { raipur: Number, raipurBasic: Number, for12mm: Number },
      size12: { raipur: Number, raipurBasic: Number, for12mm: Number },
      size16: { raipur: Number, raipurBasic: Number, for12mm: Number },
      size20: { raipur: Number, raipurBasic: Number, for12mm: Number },
      size25: { raipur: Number, raipurBasic: Number, for12mm: Number },
    },

    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SchemeMaster", schemeMasterSchema);
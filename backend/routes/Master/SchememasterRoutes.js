const express = require("express");
const router = express.Router();
const SchemeMaster = require("../../models/Master/SchemeMaster");

/*
  SCHEME OFFSET LOGIC (BASIC = X):
  SIZE | RAIPUR  | RAIPUR BASIC | FOR 12MM
   8   | +2000   | +2000        | +3540
  10   | 0       | 0            | +2360
  12   | 0       | 0            | 0
  16   | 0       | 0            | +1180
  20   | 0       | 0            | +1180
  25   | 0       | 0            | +1180
*/

const OFFSETS = {
  size8:  { raipur: 2000, raipurBasic: 2000, for12mm: 3540 },
  size10: { raipur: 0,    raipurBasic: 0,    for12mm: 2360 },
  size12: { raipur: 0,    raipurBasic: 0,    for12mm: 0    },
  size16: { raipur: 0,    raipurBasic: 0,    for12mm: 1180 },
  size20: { raipur: 0,    raipurBasic: 0,    for12mm: 1180 },
  size25: { raipur: 0,    raipurBasic: 0,    for12mm: 1180 },
};

/* Compute all prices from basicPrice */
const computePrices = (basicPrice) => {
  const X = Number(basicPrice);
  const prices = {};
  for (const [sizeKey, offsets] of Object.entries(OFFSETS)) {
    prices[sizeKey] = {
      raipur:      X + offsets.raipur,
      raipurBasic: X + offsets.raipurBasic,
      for12mm:     X + offsets.for12mm,
    };
  }
  return prices;
};

/* CREATE */
router.post("/create-scheme", async (req, res) => {
  try {
    const { schemeName, basicPrice, status } = req.body;
    const prices = computePrices(basicPrice);
    const doc = new SchemeMaster({ schemeName, basicPrice, prices, status });
    await doc.save();
    res.status(201).json({ success: true, message: "Scheme Saved Successfully", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* GET ALL */
router.get("/schemes", async (req, res) => {
  try {
    const data = await SchemeMaster.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* UPDATE — recomputes prices when basicPrice changes */
router.put("/scheme/:id", async (req, res) => {
  try {
    const { schemeName, basicPrice, status } = req.body;
    const prices = computePrices(basicPrice);
    const updated = await SchemeMaster.findByIdAndUpdate(
      req.params.id,
      { schemeName, basicPrice, prices, status },
      { new: true }
    );
    res.json({ success: true, message: "Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE */
router.delete("/scheme/:id", async (req, res) => {
  try {
    await SchemeMaster.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* EXPORT OFFSETS so frontend can use same logic */
router.get("/scheme-offsets", (req, res) => {
  res.json(OFFSETS);
});

module.exports = router;
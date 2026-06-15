const express  = require("express");
const router   = express.Router({ mergeParams: true });
const Weighment = require("../../models/Inventory/Weighment");

/* ─────────────────────────────────────────────────────────────
   Helper — generate next weighment number from document sequence
   Pattern:
     Inward  → IN{YYMMDD}{2-digit seq zero-padded}   e.g. IN2506150001
     Outward → OT{YYMMDD}{2-digit seq}               e.g. OT2506150001
     General → GN{YYMMDD}{2-digit seq}               e.g. GN2506150001
───────────────────────────────────────────────────────────── */
const prefixMap = {
  Inward:  "IN",
  Outward: "OT",
  General: "GN",
};

const getNextWeighmentNo = async (transactionType) => {
  const prefix = prefixMap[transactionType] || "GN";

  const now   = new Date();
  const yy    = String(now.getFullYear()).slice(2);
  const mm    = String(now.getMonth() + 1).padStart(2, "0");
  const dd    = String(now.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`;

  const pattern = `^${prefix}${dateStr}`;
  const count   = await Weighment.countDocuments({
    weighmentNo: { $regex: pattern },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}${dateStr}${seq}`;
};

/* GET /next-no?transactionType=Inward — get next sequence number */
router.get("/next-no", async (req, res) => {
  try {
    const { transactionType = "General" } = req.query;
    const no = await getNextWeighmentNo(transactionType);
    res.status(200).json({ success: true, weighmentNo: no });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* POST / — create new weighment */
router.post("/", async (req, res) => {
  try {
    /* Auto-assign weighment number if not provided */
    if (!req.body.weighmentNo && req.body.transactionType) {
      req.body.weighmentNo = await getNextWeighmentNo(req.body.transactionType);
    }
    const weighment = new Weighment(req.body);
    await weighment.save();
    res.status(201).json({ success: true, message: "Weighment Saved", data: weighment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* GET / — search / list weighments with optional filters */
router.get("/", async (req, res) => {
  try {
    const {
      fromDate, toDate, weighmentNo, vehicleNo,
      inwardOutwardNoteNo, status, partyName, site,
      transactionType, transactionCategory,
    } = req.query;

    const query = {};

    if (weighmentNo)         query.weighmentNo         = { $regex: weighmentNo, $options: "i" };
    if (vehicleNo)           query.vehicleNo           = { $regex: vehicleNo, $options: "i" };
    if (inwardOutwardNoteNo) query.inwardOutwardNoteNo = { $regex: inwardOutwardNoteNo, $options: "i" };
    if (status)              query.status              = status;
    if (partyName)           query.partyName           = { $regex: partyName, $options: "i" };
    if (site)                query.site                = { $regex: site, $options: "i" };
    if (transactionType)     query.transactionType     = transactionType;
    if (transactionCategory) query.transactionCategory = transactionCategory;

    if (fromDate || toDate) {
      query.weighmentDate = {};
      if (fromDate) query.weighmentDate.$gte = fromDate;
      if (toDate)   query.weighmentDate.$lte = toDate;
    }

    const data = await Weighment.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* GET /:id — get single weighment by ID */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Weighment.findById(req.params.id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* PUT /:id — update a weighment */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Weighment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: "after", runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, message: "Weighment Updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* DELETE /:id — delete a weighment */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Weighment.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Record not found" });
    res.status(200).json({ success: true, message: "Weighment Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
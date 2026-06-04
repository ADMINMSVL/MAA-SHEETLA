const express = require("express");
const router  = express.Router();
const DocumentSequence = require("../../models/Master/DocumentSequence");

/* ─── helper: build date segment ─── */
const buildDatePart = (format) => {
  const today = new Date();
  const dd    = String(today.getDate()).padStart(2, "0");
  const mm    = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy  = String(today.getFullYear());
  if (format === "mm/dd/yyyy") return `${mm}${dd}${yyyy}`;
  if (format === "yyyy/mm/dd") return `${yyyy}${mm}${dd}`;
  return `${dd}${mm}${yyyy}`;   // default: dd/mm/yyyy  →  DDMMYYYY
};

/* ══════════════════════════════════════════
   CREATE
   Body: { module, businessEntity, sequenceFormat, incrementNo }

   Generated code format: <datePart><paddedIncrement>
   Example (dd/mm/yyyy, increment 1, date 04-Jun-2026):
     datePart  = "04062026"
     paddedNo  = "01"
     result    = "0406202601"
══════════════════════════════════════════ */
router.post("/create-document-sequence", async (req, res) => {
  try {
    const {
      module,
      businessEntity,
      sequenceFormat = "dd/mm/yyyy",
      incrementNo,
    } = req.body;

    /* Find last record for this module + businessEntity to determine next number */
    const lastRecord = await DocumentSequence
      .findOne({ module, businessEntity })
      .sort({ createdAt: -1 });

    const nextNumber = lastRecord
      ? Number(lastRecord.incrementNo) + 1
      : (Number(incrementNo) || 1);

    /* 2-digit padding so first entry → "01", tenth → "10", etc. */
    const paddedNo      = String(nextNumber).padStart(2, "0");
    const datePart      = buildDatePart(sequenceFormat);
    const generatedCode = `${datePart}${paddedNo}`;   // e.g. "0406202601"

    const newData = new DocumentSequence({
      module,
      businessEntity,
      sequenceFormat,
      incrementNo: nextNumber,
      generatedCode,
    });

    await newData.save();

    res.status(201).json({
      success: true,
      message: "Document Sequence Saved",
      generatedCode,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════
   GET ALL
══════════════════════════════════════════ */
router.get("/document-sequence", async (req, res) => {
  try {
    const data = await DocumentSequence.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ══════════════════════════════════════════
   DELETE
══════════════════════════════════════════ */
router.delete("/document-sequence/:id", async (req, res) => {
  try {
    await DocumentSequence.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require("express");
const router  = express.Router();
const DocumentSequence = require("../../models/Master/DocumentSequence");

const buildDatePart = (format) => {
  const today = new Date();
  const dd   = String(today.getDate()).padStart(2, "0");
  const mm   = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = String(today.getFullYear());

  if (format === "mm/dd/yyyy") return `${mm}${dd}${yyyy}`;
  if (format === "yyyy/mm/dd") return `${yyyy}${mm}${dd}`;
  return `${dd}${mm}${yyyy}`;           // default dd/mm/yyyy
};

/* POST /api/create-document-sequence */
router.post("/create-document-sequence", async (req, res) => {
  try {
    const {
      module,
      businessEntity,
      entityPrefix    = "",
      sequenceFormat  = "dd/mm/yyyy",
      useDateFragment = true,
      incrementNo,
      sequenceDigits  = 2,              // NEW — how many digits to pad
    } = req.body;

    const prefix = entityPrefix.toString().trim().toUpperCase();

    if (!module || !businessEntity || !prefix) {
      return res.status(400).json({
        success: false,
        message: "Module, Business Entity and Entity Prefix are required.",
      });
    }

    const lastRecord = await DocumentSequence
      .findOne({ module, businessEntity, entityPrefix: prefix })
      .sort({ createdAt: -1 });

    const digits = lastRecord
      ? Math.max(1, Number(lastRecord.sequenceDigits) || 2)   // inherit from master
      : Math.max(1, Number(sequenceDigits) || 2);              // use request only on first creation

    const resolvedFormat   = lastRecord ? lastRecord.sequenceFormat   : (sequenceFormat  || "dd/mm/yyyy");
    const resolvedUsDate   = lastRecord ? lastRecord.useDateFragment  : (useDateFragment ?? true);

    const nextNumber = lastRecord
      ? Number(lastRecord.incrementNo) + 1
      : (Number(incrementNo) || 1);

    const paddedNo      = String(nextNumber).padStart(digits, "0");
    const datePart      = resolvedUsDate ? buildDatePart(resolvedFormat) : "";
    const generatedCode = `${prefix}${datePart}${paddedNo}`;

    const newData = new DocumentSequence({
      module,
      businessEntity,
      entityPrefix:    prefix,
      sequenceFormat:  resolvedFormat,
      useDateFragment: resolvedUsDate,
      sequenceDigits:  digits,
      incrementNo:     nextNumber,
      generatedCode,
    });

    await newData.save();

    res.status(201).json({
      success: true,
      message: "Document Sequence Saved",
      generatedCode,
      data: newData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* GET /api/document-sequence */
router.get("/document-sequence", async (req, res) => {
  try {
    const data = await DocumentSequence.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE /api/document-sequence/:id */
router.delete("/document-sequence/:id", async (req, res) => {
  try {
    await DocumentSequence.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
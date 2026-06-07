const express = require("express");
const router  = express.Router();
const DocumentSequence = require("../../models/Master/DocumentSequence");

/* 2-digit year date builder — matches the frontend helper exactly */
const buildDatePart = (format) => {
  const today = new Date();
  const dd  = String(today.getDate()).padStart(2, "0");
  const mm  = String(today.getMonth() + 1).padStart(2, "0");
  const yy  = String(today.getFullYear()).slice(-2); // e.g. '26'

  if (format === "mm/dd/yy") return `${mm}${dd}${yy}`;
  if (format === "yy/mm/dd") return `${yy}${mm}${dd}`;
  return `${dd}${mm}${yy}`;   // default dd/mm/yy
};

/* ══════════════════════════════════════════════
   POST /api/create-document-sequence
══════════════════════════════════════════════ */
router.post("/create-document-sequence", async (req, res) => {
  try {
    const {
      module,
      businessEntity,
      entityPrefix        = "",
      transactionCategory = "",   // NEW — stored from the category picker
      sequenceFormat      = "dd/mm/yy",
      useDateFragment     = true,
      incrementNo,
      sequenceDigits      = 2,
    } = req.body;

    const prefix = entityPrefix.toString().trim().toUpperCase();

    if (!module || !businessEntity || !prefix) {
      return res.status(400).json({
        success: false,
        message: "Module, Business Entity and Entity Prefix are required.",
      });
    }

    /* Find the most-recent existing record for this module/entity/prefix */
    const lastRecord = await DocumentSequence
      .findOne({ module, businessEntity, entityPrefix: prefix })
      .sort({ createdAt: -1 });

    /* Inherit format/settings from master on subsequent saves */
    const digits          = lastRecord
      ? Math.max(1, Number(lastRecord.sequenceDigits) || 2)
      : Math.max(1, Number(sequenceDigits) || 2);

    const resolvedFormat  = lastRecord ? lastRecord.sequenceFormat  : (sequenceFormat  || "dd/mm/yy");
    const resolvedUseDate = lastRecord ? lastRecord.useDateFragment : (useDateFragment ?? true);

    const nextNumber  = lastRecord
      ? Number(lastRecord.incrementNo) + 1
      : (Number(incrementNo) || 1);

    const paddedNo      = String(nextNumber).padStart(digits, "0");
    const datePart      = resolvedUseDate ? buildDatePart(resolvedFormat) : "";
    const generatedCode = `${prefix}${datePart}${paddedNo}`;

    const newData = await DocumentSequence.findOneAndUpdate(
      /* match the canonical record for this module/entity/prefix */
      { module, businessEntity, entityPrefix: prefix },
      /* update only the fields that change on each use */
      {
        $set: {
          transactionCategory,
          sequenceFormat:  resolvedFormat,
          useDateFragment: resolvedUseDate,
          sequenceDigits:  digits,
          incrementNo:     nextNumber,
          generatedCode,
        },
      },
      /* upsert: create the record if it genuinely doesn't exist yet */
      { new: true, upsert: true, runValidators: true }
    );

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

/* ══════════════════════════════════════════════
   GET /api/document-sequence
══════════════════════════════════════════════ */
router.get("/document-sequence", async (req, res) => {
  try {
    const data = await DocumentSequence.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ══════════════════════════════════════════════
   DELETE /api/document-sequence/:id
══════════════════════════════════════════════ */
router.delete("/document-sequence/:id", async (req, res) => {
  try {
    await DocumentSequence.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
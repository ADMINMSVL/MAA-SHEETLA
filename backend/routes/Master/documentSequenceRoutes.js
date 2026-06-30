const express = require("express");
const router  = express.Router();
const DocumentSequence = require("../../models/Master/DocumentSequence");

/* ── date builder (matches frontend) ── */
const buildDatePart = (format) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yy = String(today.getFullYear()).slice(-2);

  if (format === "mm/dd/yy") return `${mm}${dd}${yy}`;
  if (format === "yy/mm/dd") return `${yy}${mm}${dd}`;
  if (format === "julian") {
    /* Julian: YY + DDD (3-digit day-of-year, 1-indexed)
       e.g. 01-Jan-2026 → 26001, 31-Dec-2026 → 26365, 31-Dec-2024 → 24366 */
    const year   = today.getFullYear();
    const start  = new Date(year, 0, 0);
    const oneDay = 1000 * 60 * 60 * 24;
    const doy    = String(Math.floor((today - start) / oneDay)).padStart(3, "0");
    return `${yy}${doy}`;
  }
  return `${dd}${mm}${yy}`;  // default dd/mm/yy
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
      transactionCategory = "",
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

    const lastRecord = await DocumentSequence
      .findOne({ module, businessEntity, entityPrefix: prefix })
      .sort({ createdAt: -1 });

    const digits          = lastRecord ? Math.max(1, Number(lastRecord.sequenceDigits) || 2) : Math.max(1, Number(sequenceDigits) || 2);
    const resolvedFormat  = lastRecord ? lastRecord.sequenceFormat  : (sequenceFormat  || "dd/mm/yy");
    const resolvedUseDate = lastRecord ? lastRecord.useDateFragment : (useDateFragment ?? true);
    const nextNumber      = lastRecord ? Number(lastRecord.incrementNo) + 1 : (Number(incrementNo) || 1);

    const paddedNo      = String(nextNumber).padStart(digits, "0");
    const datePart      = resolvedUseDate ? buildDatePart(resolvedFormat) : "";
    const generatedCode = `${prefix}${datePart}${paddedNo}`;

    const newData = await DocumentSequence.findOneAndUpdate(
      { module, businessEntity, entityPrefix: prefix },
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
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: "Document Sequence Saved", generatedCode, data: newData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   GET /api/document-sequence
══════════════════════════════════════════════ */
router.get("/document-sequence", async (req, res) => {
  try {
    const data = await DocumentSequence.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════
   PUT /api/document-sequence/:id   ← EDIT
   Allows editing configuration fields.
   Re-generates the code using the UPDATED settings
   but keeps the current incrementNo unchanged
   (the counter only advances on POST/usage).
══════════════════════════════════════════════ */
router.put("/document-sequence/:id", async (req, res) => {
  try {
    const existing = await DocumentSequence.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Record not found" });

    const {
      module             = existing.module,
      businessEntity     = existing.businessEntity,
      entityPrefix       = existing.entityPrefix,
      transactionCategory= existing.transactionCategory,
      sequenceFormat     = existing.sequenceFormat,
      useDateFragment    = existing.useDateFragment,
      sequenceDigits     = existing.sequenceDigits,
      incrementNo        = existing.incrementNo,   // editor can manually set the counter
    } = req.body;

    const prefix    = entityPrefix.toString().trim().toUpperCase();
    const digits    = Math.max(1, Number(sequenceDigits) || 2);
    const paddedNo  = String(Number(incrementNo)).padStart(digits, "0");
    const datePart  = useDateFragment ? buildDatePart(sequenceFormat) : "";
    const generatedCode = `${prefix}${datePart}${paddedNo}`;

    const updated = await DocumentSequence.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          module,
          businessEntity,
          entityPrefix:        prefix,
          transactionCategory,
          sequenceFormat,
          useDateFragment,
          sequenceDigits:      digits,
          incrementNo:         Number(incrementNo),
          generatedCode,
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    res.json({ success: true, message: "Document Sequence Updated", generatedCode, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ══════════════════════════════════════════════
   DELETE /api/document-sequence/:id
══════════════════════════════════════════════ */
router.delete("/document-sequence/:id", async (req, res) => {
  try {
    await DocumentSequence.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
const express = require("express");
const router  = express.Router();
const PurchaseOrder    = require("../../models/Procurement/PurchaseOrder");
const DocumentSequence = require("../../models/Master/DocumentSequence");

/* ── shared date builder (same logic as documentSequenceRoutes) ── */
const buildDatePart = (format) => {
  const today = new Date();
  const dd   = String(today.getDate()).padStart(2, "0");
  const mm   = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = String(today.getFullYear());

  if (format === "mm/dd/yyyy") return `${mm}${dd}${yyyy}`;
  if (format === "yyyy/mm/dd") return `${yyyy}${mm}${dd}`;
  return `${dd}${mm}${yyyy}`;           // default dd/mm/yyyy
};

/* ══════════════════════════════════════════════
   GET — Generate next PO number from DocumentSequence
   Query: module, businessEntity, entityPrefix
   Example: /api/purchase-order/next-sequence?module=Purchase%20Order&businessEntity=GYPMART%20INDIA&entityPrefix=PO
══════════════════════════════════════════════ */
router.get("/purchase-order/next-sequence", async (req, res) => {
  try {
    const { module, businessEntity, entityPrefix } = req.query;
    const prefix = (entityPrefix || "").toString().trim().toUpperCase();

    if (!module || !businessEntity || !prefix) {
      return res.status(400).json({
        success: false,
        message: "module, businessEntity and entityPrefix are required",
      });
    }

    const lastRecord = await DocumentSequence
      .findOne({ module, businessEntity, entityPrefix: prefix })
      .sort({ createdAt: -1 });

    if (!lastRecord) {
      return res.status(404).json({
        success: false,
        message: `No document sequence found for module="${module}", entity="${businessEntity}", prefix="${prefix}". Please create one in Document Sequence settings first.`,
      });
    }

    const digits   = Math.max(1, Number(lastRecord.sequenceDigits) || 2);
    const nextNo   = Number(lastRecord.incrementNo) + 1;
    const paddedNo = String(nextNo).padStart(digits, "0");
    const datePart = lastRecord.useDateFragment ? buildDatePart(lastRecord.sequenceFormat) : "";
    const nextCode = `${prefix}${datePart}${paddedNo}`;

    res.json({
      success: true,
      nextCode,
      nextIncrement: nextNo,
      sequenceId: lastRecord._id,
    });
  } catch (error) {
    console.error("PO next-sequence error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   CREATE
══════════════════════════════════════════════ */
router.post("/create-purchase-order", async (req, res) => {
  try {
    const po = new PurchaseOrder(req.body);
    await po.save();
    res.status(201).json({ success: true, message: "Purchase Order Saved Successfully", data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   GET ALL
══════════════════════════════════════════════ */
router.get("/purchase-orders", async (req, res) => {
  try {
    const data = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   GET BY ID
══════════════════════════════════════════════ */
router.get("/purchase-order/:id", async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json(po);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   UPDATE
══════════════════════════════════════════════ */
router.put("/purchase-order/:id", async (req, res) => {
  try {
    const updated = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: "Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ══════════════════════════════════════════════
   DELETE
══════════════════════════════════════════════ */
router.delete("/purchase-order/:id", async (req, res) => {
  try {
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
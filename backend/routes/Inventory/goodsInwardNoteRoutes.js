const express = require("express");
const router  = express.Router();
const Weighment       = require("../../models/Inventory/Weighment");
const GoodsInwardNote = require("../../models/Inventory/GoodsInwardNote");
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
   GET — Generate next GIN number from DocumentSequence
   Query params: module, businessEntity, entityPrefix
   Example: /api/goods-inward-note/next-sequence?module=Goods%20Inward%20Note&businessEntity=GYPMART%20INDIA&entityPrefix=GIN
══════════════════════════════════════════════ */
router.get("/goods-inward-note/next-sequence", async (req, res) => {
  try {
    const { module, businessEntity, entityPrefix } = req.query;
    const prefix = (entityPrefix || "").toString().trim().toUpperCase();

    if (!module || !businessEntity || !prefix) {
      return res.status(400).json({
        success: false,
        message: "module, businessEntity and entityPrefix are required",
      });
    }

    /* Find latest sequence record for this combination */
    const lastRecord = await DocumentSequence
      .findOne({ module, businessEntity, entityPrefix: prefix })
      .sort({ createdAt: -1 });

    if (!lastRecord) {
      return res.status(404).json({
        success: false,
        message: `No document sequence found for module="${module}", entity="${businessEntity}", prefix="${prefix}". Please create one first.`,
      });
    }

    const digits    = Math.max(1, Number(lastRecord.sequenceDigits) || 2);
    const nextNo    = Number(lastRecord.incrementNo) + 1;
    const paddedNo  = String(nextNo).padStart(digits, "0");
    const datePart  = lastRecord.useDateFragment ? buildDatePart(lastRecord.sequenceFormat) : "";
    const nextCode  = `${prefix}${datePart}${paddedNo}`;

    res.json({
      success: true,
      nextCode,
      nextIncrement: nextNo,
      sequenceId: lastRecord._id,
    });
  } catch (error) {
    console.error("next-sequence error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   POST — Create new GIN
══════════════════════════════════════════════ */
router.post("/goods-inward-note", async (req, res) => {
  try {
    const newGIN = new GoodsInwardNote(req.body);
    await newGIN.save();
    res.status(201).json({
      success: true,
      message: "Goods Inward Note Saved Successfully",
      data: newGIN,
    });
  } catch (error) {
    console.error("GIN save error:", error);
    res.status(500).json({ success: false, message: "Error Saving Goods Inward Note: " + error.message });
  }
});

/* ══════════════════════════════════════════════
   GET — List / Search GINs with filters
   Also merges linked weighment data per record
══════════════════════════════════════════════ */
router.get("/goods-inward-note", async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      ginNumber,
      status,
      vendorCode,
      vendorName,
      poCpoNo,
      transactionCategory,
      ginDescription,
      ginType,
      vehicleEntry,
      vehicleNo,
      challanInvoiceNo,
      challanDate,
      ewayDate,
      site,
    } = req.query;

    const query = {};

    /* Date range on ginDate */
    if (fromDate || toDate) {
      query.ginDate = {};
      if (fromDate) query.ginDate.$gte = fromDate;
      if (toDate)   query.ginDate.$lte = toDate;
    }

    if (ginNumber)           query.ginNo               = { $regex: ginNumber,           $options: "i" };
    if (status)              query.status              = status;
    if (vendorCode)          query.vendorCode          = { $regex: vendorCode,          $options: "i" };
    if (vendorName)          query.vendorName          = { $regex: vendorName,          $options: "i" };
    if (poCpoNo)             query.poCpoNo             = { $regex: poCpoNo,             $options: "i" };
    if (transactionCategory) query.transactionCategory = { $regex: transactionCategory, $options: "i" };
    if (ginDescription)      query.ginDescription      = { $regex: ginDescription,      $options: "i" };
    if (ginType)             query.ginType             = ginType;
    if (vehicleEntry)        query.vehicleEntry        = vehicleEntry;
    if (vehicleNo)           query.vehicleNo           = { $regex: vehicleNo,           $options: "i" };
    if (challanInvoiceNo)    query.challanInvoiceNo    = { $regex: challanInvoiceNo,    $options: "i" };
    if (challanDate)         query.challanDate         = challanDate;
    if (ewayDate)            query.ewayDate            = ewayDate;
    if (site)                query.site                = { $regex: site,                $options: "i" };

    const ginData = await GoodsInwardNote.find(query).sort({ createdAt: -1 });

    /* Merge linked weighment data so the list page shows weight fields */
    const mergedData = await Promise.all(
      ginData.map(async (gin) => {
        const weighment = await Weighment.findOne({ inwardOutwardNoteNo: gin.ginNo });
        return {
          ...gin.toObject(),
          weighmentNo:         weighment?.weighmentNo      || "",
          weighmentId:         weighment?._id?.toString()  || "",
          transactionType:     weighment?.transactionType  || "",
          weighmentDate:       weighment?.weighmentDate    || "",
          weighmentInDate:     weighment?.weighmentInDate  || "",
          weighmentOutDate:    weighment?.weighmentOutDate || "",
          firstWeight:         weighment?.firstWeight      || "",
          secondWeight:        weighment?.secondWeight     || "",
          netWeight:           weighment?.netWeight        || "",
          transporterName:     weighment?.transporterName  || "",
        };
      })
    );

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("GIN fetch error:", error);
    res.status(500).json({ success: false, message: "Error Fetching Data: " + error.message });
  }
});

/* ══════════════════════════════════════════════
   GET — Single GIN by ID
══════════════════════════════════════════════ */
router.get("/goods-inward-note/:id", async (req, res) => {
  try {
    const data = await GoodsInwardNote.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   DELETE — Remove GIN by ID
══════════════════════════════════════════════ */
router.delete("/goods-inward-note/:id", async (req, res) => {
  try {
    await GoodsInwardNote.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   PUT — Update GIN by ID
══════════════════════════════════════════════ */
router.put("/goods-inward-note/:id", async (req, res) => {
  try {
    const updatedData = await GoodsInwardNote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedData)
      return res.status(404).json({ success: false, message: "Record Not Found" });
    res.json({ success: true, message: "Updated Successfully", data: updatedData });
  } catch (error) {
    console.error("GIN update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
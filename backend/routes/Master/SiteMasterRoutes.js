const express = require("express");
const router  = express.Router();
const SiteMaster = require("../../models/Master/SiteMaster");

/* ══════════════════════════════════════════
   CREATE
══════════════════════════════════════════ */
router.post("/create-site", async (req, res) => {
  try {
    const doc = new SiteMaster(req.body);
    await doc.save();
    res.status(201).json({
      success: true,
      message: "Site Saved Successfully",
      data: doc,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Site Code already exists. Use a unique code.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════
   GET ALL
══════════════════════════════════════════ */
router.get("/sites", async (req, res) => {
  try {
    const data = await SiteMaster.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════
   FILTER BY MODULE + BUSINESS ENTITY
   Used by any page (GIN, Inward, etc.) to
   show only the sites relevant to that form.

   GET /api/sites/filter
     ?module=Inventory
     &businessEntity=GRN
     &status=Active          ← optional, defaults to Active
══════════════════════════════════════════ */
router.get("/sites/filter", async (req, res) => {
  try {
    const { module, businessEntity, status } = req.query;

    const query = {};
    if (module)         query.module         = module;
    if (businessEntity) query.businessEntity  = businessEntity;
    query.status = status || "Active";           // always filter by status

    const data = await SiteMaster.find(query).sort({ siteCode: 1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
router.put("/site/:id", async (req, res) => {
  try {
    const updated = await SiteMaster.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, message: "Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ══════════════════════════════════════════
   DELETE
══════════════════════════════════════════ */
router.delete("/site/:id", async (req, res) => {
  try {
    await SiteMaster.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
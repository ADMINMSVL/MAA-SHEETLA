const express = require("express");
const router = express.Router();
const TaxDetails = require("../../models/Master/TaxDetails");

router.post("/create-tax-details", async (req, res) => {
  try {
    const doc = new TaxDetails(req.body);
    await doc.save();
    res.status(201).json({ success: true, message: "Tax Details Saved Successfully", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/tax-details", async (req, res) => {
  try {
    const data = await TaxDetails.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/tax-details/:id", async (req, res) => {
  try {
    const updated = await TaxDetails.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: "Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/tax-details/:id", async (req, res) => {
  try {
    await TaxDetails.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
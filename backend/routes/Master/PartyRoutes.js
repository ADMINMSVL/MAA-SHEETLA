const express = require("express");
const router = express.Router();
const Party = require("../../models/Master/Party");

/* CREATE */
router.post("/create-party", async (req, res) => {
  try {
    const party = new Party(req.body);
    await party.save();
    res.status(201).json({
      success: true,
      message: "Party Saved Successfully",
      data: party,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* GET ALL */
router.get("/parties", async (req, res) => {
  try {
    const parties = await Party.find().sort({ createdAt: -1 });
    res.status(200).json(parties);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* SEARCH */
router.get("/parties/search", async (req, res) => {
  try {
    const { partyCode, partyName, type, status } = req.query;
    let query = {};
    if (partyCode) query.partyCode = { $regex: partyCode, $options: "i" };
    if (partyName) query.partyName = { $regex: partyName, $options: "i" };
    if (type) query.type = type;
    if (status) query.status = status;
    const data = await Party.find(query);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UPDATE */
router.put("/party/:id", async (req, res) => {
  try {
    const updated = await Party.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, message: "Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE */
router.delete("/party/:id", async (req, res) => {
  try {
    await Party.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
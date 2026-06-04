const express = require("express");
const router = express.Router();
const Item = require("../../models/Master/Item");

/* CREATE */
router.post("/create-item", async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json({ success: true, message: "Item Saved Successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* GET ALL */
router.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* SEARCH */
router.get("/items/search", async (req, res) => {
  try {
    const { itemCode, itemName, category, status } = req.query;
    let query = {};
    if (itemCode) query.itemCode = { $regex: itemCode, $options: "i" };
    if (itemName) query.itemName = { $regex: itemName, $options: "i" };
    if (category) query.category = { $regex: category, $options: "i" };
    if (status) query.status = status;
    const data = await Item.find(query);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UPDATE */
router.put("/item/:id", async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: "Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE */
router.delete("/item/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
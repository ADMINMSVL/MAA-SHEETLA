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

/* BULK CREATE — used by Excel/CSV upload */
router.post("/bulk-create-items", async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided." });
    }

    const invalid = data.filter((r) => !r.itemCode?.toString().trim() || !r.itemName?.toString().trim());
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${invalid.length} row(s) are missing Item Code or Item Name.`,
      });
    }

    const docs = data.map((r) => ({
      itemCode:   r.itemCode?.toString().trim(),
      itemName:   r.itemName?.toString().trim(),
      category:   r.category?.toString().trim() || "",
      uom:        r.uom?.toString().trim() || "",
      hsn:        r.hsn?.toString().trim() || "",
      gstPercent: r.gstPercent ? Number(r.gstPercent) : undefined,
      grade:      r.grade?.toString().trim() || "",
      size:       r.size?.toString().trim() || "",
      status:     r.status?.toString().trim() || "Active",
    }));

    const result = await Item.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, message: "Bulk upload successful.", count: result.length });
  } catch (error) {
    if (error.insertedDocs) {
      res.status(207).json({
        success: true,
        message: `${error.insertedDocs.length} inserted, some rows failed.`,
        count: error.insertedDocs.length,
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
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

router.get("/item/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    const item = await Item.findOne({
      $or: [
        { _id: identifier },
        { itemCode: identifier }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
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
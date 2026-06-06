const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Party = require("../../models/Master/Party");

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value.toString().trim() !== "") || "";

const normalizePartyPayload = (body) => ({
  ...body,
  addressLine1: firstValue(body.addressLine1, body.address1, body.address_1, body["address line 1"], body["Address Line 1"]),
  addressLine2: firstValue(body.addressLine2, body.address2, body.address_2, body["address line 2"], body["Address Line 2"]),
  pin: firstValue(body.pin, body.pincode, body.pinCode, body.pinNo, body["Pin"], body["PIN"], body["Pin Code"]),
});

const buildPartyDocument = (body) => {
  const payload = normalizePartyPayload(body);

  return {
    partyCode: payload.partyCode?.toString().trim() || "",
    partyName: payload.partyName?.toString().trim() || "",
    type: payload.type?.toString().trim() || "",
    city: payload.city?.toString().trim() || "",
    addressLine1: payload.addressLine1?.toString().trim() || "",
    addressLine2: payload.addressLine2?.toString().trim() || "",
    pin: payload.pin?.toString().trim() || "",
    gstNo: payload.gstNo?.toString().trim() || "",
    mobile: payload.mobile?.toString().trim() || "",
    payTerms: payload.payTerms?.toString().trim() || "",
    creditDays: payload.creditDays === "" || payload.creditDays === null || payload.creditDays === undefined
      ? null
      : Number(payload.creditDays),
    status: payload.status?.toString().trim() || "Active",
  };
};

const normalizePartyResponse = (party) => {
  const data = party.toObject ? party.toObject() : party;

  return {
    ...data,
    addressLine1: firstValue(data.addressLine1, data.address1, data.address_1, data["address line 1"], data["Address Line 1"]),
    addressLine2: firstValue(data.addressLine2, data.address2, data.address_2, data["address line 2"], data["Address Line 2"]),
    pin: firstValue(data.pin, data.pincode, data.pinCode, data.pinNo, data["Pin"], data["PIN"], data["Pin Code"]),
  };
};

/* CREATE */
router.post("/create-party", async (req, res) => {
  try {
    const payload = buildPartyDocument(req.body);

    if (!payload.partyCode || !payload.partyName || !payload.pin) {
      return res.status(400).json({
        success: false,
        message: "Party Code, Party Name and Pin are required.",
      });
    }

    const party = new Party(payload);
    await party.save();
    res.status(201).json({ success: true, message: "Party Saved Successfully", data: normalizePartyResponse(party) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* BULK CREATE — used by Excel/CSV upload */
router.post("/bulk-create-parties", async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided." });
    }

    // Basic validation: partyCode, partyName & pin must be present
    const invalid = data.filter((r) => {
      const row = buildPartyDocument(r);
      return !row.partyCode?.toString().trim() || !row.partyName?.toString().trim() || !row.pin?.toString().trim();
    });
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${invalid.length} row(s) are missing Party Code, Party Name or Pin.`,
      });
    }

    // Normalise types
    const docs = data.map((r) => {
      return buildPartyDocument(r);
    });

    const result = await Party.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, message: "Bulk upload successful.", count: result.length });
  } catch (error) {
    // ordered:false — partial success possible; report what happened
    if (error.insertedDocs) {
      res.status(207).json({
        success: true,
        message: `${error.insertedDocs.length} inserted, some rows failed (duplicate keys?).`,
        count: error.insertedDocs.length,
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/* GET ALL */
router.get("/parties", async (req, res) => {
  try {
    const parties = await Party.find().sort({ createdAt: -1 });
    res.status(200).json(parties.map(normalizePartyResponse));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* GET BY ID OR PARTY CODE */
router.get("/party/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const party = mongoose.Types.ObjectId.isValid(identifier)
      ? await Party.findById(identifier)
      : await Party.findOne({ partyCode: identifier });

    if (!party) {
      return res.status(404).json({ success: false, message: "Party not found" });
    }
    res.status(200).json(normalizePartyResponse(party));
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
    res.status(200).json(data.map(normalizePartyResponse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* UPDATE */
router.put("/party/:id", async (req, res) => {
  try {
    const payload = buildPartyDocument(req.body);

    if (!payload.partyCode || !payload.partyName || !payload.pin) {
      return res.status(400).json({
        success: false,
        message: "Party Code, Party Name and Pin are required.",
      });
    }

    const updated = await Party.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, message: "Updated Successfully", data: normalizePartyResponse(updated) });
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

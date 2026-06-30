const express = require("express");
const router = express.Router();

const CCMProduction = require("../../models/Production/CCMProduction");



/* ======================================================
   CREATE CCM
====================================================== */

router.post("/ccm-production", async (req, res) => {
  try {
    const {
      ccmNo,
      heatNo,
      inputs,
      outputs,
    } = req.body;

    if (!ccmNo) {
      return res.status(400).json({
        success: false,
        message: "CCM No is required",
      });
    }

    if (!heatNo) {
      return res.status(400).json({
        success: false,
        message: "Heat No is required",
      });
    }

    if (!inputs || inputs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Input Material is required",
      });
    }

    if (!outputs || outputs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Output Billets are required",
      });
    }

    const exists = await CCMProduction.findOne({
      ccmNo,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "CCM No already exists",
      });
    }

    const ccm = new CCMProduction(req.body);

    await ccm.save();

    res.status(201).json({
      success: true,
      message: "CCM Production saved successfully",
      data: ccm,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});



/* ======================================================
   GET ALL CCM
====================================================== */

router.get("/ccm-production", async (req, res) => {
  try {

    const {
      fromDate,
      toDate,
      ccmNo,
      heatNo,
      shift,
      site,
      status,
    } = req.query;

    const filter = {};

    if (fromDate || toDate) {

      filter.ccmDate = {};

      if (fromDate) {
        filter.ccmDate.$gte = fromDate;
      }

      if (toDate) {
        filter.ccmDate.$lte = toDate;
      }
    }

    if (ccmNo) {
      filter.ccmNo = {
        $regex: ccmNo,
        $options: "i",
      };
    }

    if (heatNo) {
      filter.heatNo = {
        $regex: heatNo,
        $options: "i",
      };
    }

    if (shift) {
      filter.shift = shift;
    }

    if (site) {
      filter.site = site;
    }

    if (status) {
      filter.status = status;
    }

    const data = await CCMProduction
      .find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});



/* ======================================================
   GET CCM BY ID
====================================================== */

router.get("/ccm-production/:id", async (req, res) => {
  try {

    const data = await CCMProduction.findById(
      req.params.id
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "CCM Record not found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});



/* ======================================================
   UPDATE CCM
====================================================== */

router.put("/ccm-production/:id", async (req, res) => {
  try {

    const updated =
      await CCMProduction.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          returnDocument: "after",
          runValidators: true,
        }
      );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "CCM Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "CCM Production updated successfully",
      data: updated,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});



/* ======================================================
   DELETE CCM
====================================================== */

router.delete("/ccm-production/:id", async (req, res) => {
  try {

    const deleted =
      await CCMProduction.findByIdAndDelete(
        req.params.id
      );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "CCM Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "CCM Production deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});



module.exports = router;
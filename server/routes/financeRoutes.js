const express = require("express");
const router = express.Router();
const Finance = require("../models/Finance");

// GET /api/finance
router.get("/", async (req, res, next) => {
  try {
    const records = await Finance.find().sort({ year: -1, month: -1 });
    res.json(records);
  } catch (error) {
    next(error);
  }
});

// POST /api/finance
router.post("/", async (req, res, next) => {
  try {
    const financeRecord = new Finance(req.body);
    const saved = await financeRecord.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

module.exports = router;

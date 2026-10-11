const express = require("express");
const router = express.Router();
const Environment = require("../models/Environment");

// GET /api/environment
router.get("/", async (req, res, next) => {
  try {
    const records = await Environment.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    next(error);
  }
});

// POST /api/environment
router.post("/", async (req, res, next) => {
  try {
    const envRecord = new Environment(req.body);
    const saved = await envRecord.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

module.exports = router;

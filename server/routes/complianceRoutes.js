const express = require("express");
const router = express.Router();
const Compliance = require("../models/Compliance");

// GET /api/compliance
router.get("/", async (req, res, next) => {
  try {
    const compliance = await Compliance.find().sort({ daysToExpiry: 1 });
    res.json(compliance);
  } catch (error) {
    next(error);
  }
});

// POST /api/compliance
router.post("/", async (req, res, next) => {
  try {
    const doc = new Compliance(req.body);
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// PUT /api/compliance/:id
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Compliance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Compliance document not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

module.exports = router;

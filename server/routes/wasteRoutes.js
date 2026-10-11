const express = require("express");
const router = express.Router();
const Waste = require("../models/Waste");

// GET /api/waste
router.get("/", async (req, res, next) => {
  try {
    const waste = await Waste.find().sort({ createdAt: -1 });
    res.json(waste);
  } catch (error) {
    next(error);
  }
});

// POST /api/waste
router.post("/", async (req, res, next) => {
  try {
    const wasteRecord = new Waste(req.body);
    const saved = await wasteRecord.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// PUT /api/waste/:id
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Waste.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Waste record not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// DELETE /api/waste/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Waste.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Waste record not found" });
    }
    res.json({ message: "Waste record deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

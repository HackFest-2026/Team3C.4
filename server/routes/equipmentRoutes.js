const express = require("express");
const router = express.Router();
const Equipment = require("../models/Equipment");

// GET /api/equipment
router.get("/", async (req, res, next) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    next(error);
  }
});

// POST /api/equipment
router.post("/", async (req, res, next) => {
  try {
    const item = new Equipment(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// PUT /api/equipment/:id
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// DELETE /api/equipment/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Equipment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    res.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

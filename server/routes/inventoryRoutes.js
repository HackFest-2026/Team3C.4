const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");

// GET /api/inventory
router.get("/", async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ createdAt: -1 });
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory
router.post("/", async (req, res, next) => {
  try {
    const item = new Inventory(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// PUT /api/inventory/:id
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// DELETE /api/inventory/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

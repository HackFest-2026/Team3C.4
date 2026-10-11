const express = require("express");
const router = express.Router();
const Worker = require("../models/Worker");

// GET /api/workers
router.get("/", async (req, res, next) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    next(error);
  }
});

// POST /api/workers
router.post("/", async (req, res, next) => {
  try {
    const worker = new Worker(req.body);
    const savedWorker = await worker.save();
    res.status(201).json(savedWorker);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// PUT /api/workers/:id
router.put("/:id", async (req, res, next) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedWorker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    res.json(updatedWorker);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// DELETE /api/workers/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedWorker = await Worker.findByIdAndDelete(req.params.id);
    if (!deletedWorker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// GET /api/health
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  res.status(200).json({
    status: "ok",
    service: "MineGuard API",
    version: "2.0.0",
    database: states[dbState] || "unknown",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

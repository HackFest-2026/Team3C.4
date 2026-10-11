const express = require("express");
const router = express.Router();

const Worker = require("../models/Worker");
const Equipment = require("../models/Equipment");
const Inventory = require("../models/Inventory");
const Environment = require("../models/Environment");
const Waste = require("../models/Waste");
const Finance = require("../models/Finance");
const Compliance = require("../models/Compliance");
const { analyzeMineData } = require("../services/aiEngine");

// GET /api/ai-intelligence
router.get("/", async (req, res, next) => {
  try {
    const [workers, equipment, inventory, environment, waste, finance, compliance] = await Promise.all([
      Worker.find().lean(),
      Equipment.find().lean(),
      Inventory.find().lean(),
      Environment.find().lean(),
      Waste.find().lean(),
      Finance.find().lean(),
      Compliance.find().lean(),
    ]);

    const intelligence = analyzeMineData({
      workers,
      equipment,
      inventory,
      environment,
      waste,
      finance,
      compliance,
    });

    res.json(intelligence);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

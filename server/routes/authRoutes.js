const express = require("express");
const router = express.Router();
const Worker = require("../models/Worker");

// POST /api/register-face
router.post("/register-face", async (req, res) => {
  try {
    const { workerId, name, role, department, faceDescriptor } = req.body;

    if (!workerId || !name || !role || !faceDescriptor) {
      return res.status(400).json({
        message: "Management ID, name, role and face descriptor are required."
      });
    }

    const authorizedRoles = [
      "CEO",
      "Mining Factory Builder / Owner",
      "Manager",
      "Safety Officer",
      "Department Head"
    ];

    if (!authorizedRoles.includes(role)) {
      return res.status(400).json({
        message: "This role is not authorized for MineGuard management access."
      });
    }

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({
        message: `Invalid face descriptor. Expected 128 values but received ${
          Array.isArray(faceDescriptor) ? faceDescriptor.length : "non-array"
        }.`
      });
    }

    const descriptorIsValid = faceDescriptor.every(
      (val) => typeof val === "number" && Number.isFinite(val)
    );

    if (!descriptorIsValid) {
      return res.status(400).json({
        message: "Face descriptor contains invalid numeric values."
      });
    }

    const existingWorker = await Worker.findOne({ workerId: workerId.trim() });
    if (existingWorker && existingWorker.name !== name.trim()) {
      return res.status(409).json({
        message: "This Management ID is already registered to another person."
      });
    }

    const worker = await Worker.findOneAndUpdate(
      { workerId: workerId.trim() },
      {
        workerId: workerId.trim(),
        name: name.trim(),
        role: role,
        designation: role,
        department: department || "Management",
        faceDescriptor: faceDescriptor,
        status: "Present",
        riskLevel: "Low",
        ppeStatus: "All PPE Verified",
        zone: "Command Center"
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(201).json({
      message: "Management face registered successfully.",
      worker
    });
  } catch (error) {
    console.error("Face registration error:", error);
    res.status(500).json({
      message: "Error registering management face.",
      error: error.message
    });
  }
});

module.exports = router;

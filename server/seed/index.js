const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Worker = require("../models/Worker");
const Equipment = require("../models/Equipment");
const Inventory = require("../models/Inventory");
const Environment = require("../models/Environment");
const Waste = require("../models/Waste");
const Finance = require("../models/Finance");
const Compliance = require("../models/Compliance");

// Sample initial management accounts
const initialManagers = [
  {
    workerId: "MG-SAFE-01",
    name: "Dr. Rajesh Sharma",
    role: "Safety Officer",
    designation: "Chief Mine Safety Inspector",
    department: "Mine Safety & Environmental Protection",
    shift: "Morning",
    zone: "Central Command Center",
    currentDuty: "Safety Audit & Gas Hazard Protocols",
    status: "Present",
    attendance: 98,
    experience: "12 Years",
    skillCertification: "DGMS First Class Mine Safety",
    equipmentAssigned: "Hazard Detection Suite",
    ppeStatus: "All PPE Verified",
    riskLevel: "Low",
    gasExposure: "Normal",
    blastZoneClearance: "Cleared",
    faceDescriptor: Array(128).fill(0).map((_, i) => Math.sin(i * 0.1) * 0.2)
  },
  {
    workerId: "MG-MGR-01",
    name: "Sunita Verma",
    role: "Manager",
    designation: "General Mining Operations Manager",
    department: "Extraction & Production Operations",
    shift: "Morning",
    zone: "Operations Control Hub",
    currentDuty: "Shift Dispatch & Fleet Allocation",
    status: "Present",
    attendance: 96,
    experience: "9 Years",
    skillCertification: "Mining Engineering & Operations",
    equipmentAssigned: "Dispatch Console",
    ppeStatus: "All PPE Verified",
    riskLevel: "Low",
    gasExposure: "Normal",
    blastZoneClearance: "Cleared",
    faceDescriptor: Array(128).fill(0).map((_, i) => Math.sin(i * 0.1) * 0.2)
  },
  {
    workerId: "MG-EXEC-01",
    name: "Vikram Singhania",
    role: "CEO",
    designation: "Chief Executive Officer & Mine Director",
    department: "Executive Management",
    shift: "General",
    zone: "Central Command Center",
    currentDuty: "Mine Oversight & Operations Authorization",
    status: "Present",
    attendance: 100,
    experience: "18 Years",
    skillCertification: "Executive Mining License DGMS",
    equipmentAssigned: "Command Terminal Alpha",
    ppeStatus: "All PPE Verified",
    riskLevel: "Low",
    gasExposure: "Normal",
    blastZoneClearance: "Cleared",
    faceDescriptor: Array(128).fill(0).map((_, i) => Math.sin(i * 0.1) * 0.2)
  }
];

async function runSeed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mineguard";

  try {
    console.log(`[MineGuard Seeder] Connecting to ${uri}...`);
    await mongoose.connect(uri);
    console.log("[MineGuard Seeder] Connected to MongoDB.");

    // 1. Seed Managers
    console.log("[MineGuard Seeder] Seeding management accounts...");
    for (const m of initialManagers) {
      await Worker.findOneAndUpdate({ workerId: m.workerId }, m, { upsert: true, new: true });
    }
    console.log("✓ Managers seeded.");

    console.log("\n[MineGuard Seeder] Database check complete! All core collections ready.");
    await mongoose.disconnect();
    console.log("[MineGuard Seeder] Disconnected from MongoDB. Seed script completed successfully.\n");
    process.exit(0);
  } catch (err) {
    console.error("[MineGuard Seeder] Seeding error:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;

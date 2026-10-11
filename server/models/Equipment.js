const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    equipmentName: {
      type: String,
      required: true,
      trim: true,
    },

    equipmentType: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      default: "",
    },

    model: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    currentLocation: {
      type: String,
      required: true,
    },

    assignedWorkerId: {
      type: String,
      default: "",
    },

    assignedWorkerName: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Operational",
    },

    maintenanceResponsible: {
      type: String,
      default: "",
    },

    maintenanceStatus: {
      type: String,
      default: "Up to Date",
    },

    fuelLevel: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    operatingHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    purchaseCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastMaintenanceDate: {
      type: String,
      default: "",
    },

    nextMaintenanceDate: {
      type: String,
      default: "",
    },

    securityStatus: {
      type: String,
      default: "Secured",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Equipment", equipmentSchema);
const mongoose = require("mongoose");

const environmentSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    zone: {
      type: String,
      required: true,
    },

    temperature: {
      type: Number,
      default: 0,
    },

    humidity: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    pm25: {
      type: Number,
      default: 0,
      min: 0,
    },

    pm10: {
      type: Number,
      default: 0,
      min: 0,
    },

    airQualityIndex: {
      type: Number,
      default: 0,
      min: 0,
    },

    airQualityStatus: {
      type: String,
      default: "Good",
    },

    noiseLevel: {
      type: Number,
      default: 0,
      min: 0,
    },

    waterQuality: {
      type: String,
      default: "Normal",
    },

    waterPh: {
      type: Number,
      default: 7,
      min: 0,
      max: 14,
    },

    dustSuppression: {
      type: String,
      default: "Active",
    },

    environmentalProtection: {
      type: String,
      default: "Compliant",
    },

    riskLevel: {
      type: String,
      default: "Low",
    },

    unusualChange: {
      type: Boolean,
      default: false,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Environment", environmentSchema);
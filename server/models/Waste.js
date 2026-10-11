const mongoose = require("mongoose");

const wasteSchema = new mongoose.Schema(
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

    wasteType: {
      type: String,
      required: true,
      trim: true,
    },

    materialName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      default: "Tonnes",
    },

    sourceZone: {
      type: String,
      required: true,
    },

    storageLocation: {
      type: String,
      required: true,
    },

    disposalMethod: {
      type: String,
      default: "Pending",
    },

    disposalDate: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Stored",
    },

    reusableQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reuseOpportunity: {
      type: String,
      default: "Under Assessment",
    },

    environmentalRisk: {
      type: String,
      default: "Low",
    },

    productionSource: {
      type: String,
      default: "Gold Ore Extraction & Processing",
    },

    unusualChange: {
      type: Boolean,
      default: false,
    },

    responsiblePerson: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Waste", wasteSchema);
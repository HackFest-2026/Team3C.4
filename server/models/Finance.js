const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    month: {
      type: String,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    productionCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    laborCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    maintenanceCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    fuelCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    environmentalCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    equipmentCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    inventoryCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    otherExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },

    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    profit: {
      type: Number,
      default: 0,
    },

    budget: {
      type: Number,
      default: 0,
      min: 0,
    },

    budgetStatus: {
      type: String,
      default: "Within Budget",
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

module.exports = mongoose.model("Finance", financeSchema);
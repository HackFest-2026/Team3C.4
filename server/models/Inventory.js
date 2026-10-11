const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      default: "Units",
    },

    minimumStockLevel: {
      type: Number,
      default: 10,
      min: 0,
    },

    storageLocation: {
      type: String,
      required: true,
    },

    supplier: {
      type: String,
      default: "",
    },

    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockStatus: {
      type: String,
      default: "In Stock",
    },

    lastRestockedDate: {
      type: String,
      default: "",
    },

    expiryDate: {
      type: String,
      default: "",
    },

    responsiblePerson: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Inventory", inventorySchema);
const mongoose = require("mongoose");

const complianceSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    documentName: {
      type: String,
      required: true,
      trim: true,
    },

    documentType: {
      type: String,
      required: true,
      trim: true,
    },

    issuingAuthority: {
      type: String,
      default: "",
    },

    issueDate: {
      type: String,
      required: true,
    },

    expiryDate: {
      type: String,
      required: true,
    },

    documentNumber: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    responsiblePerson: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Valid",
    },

    daysToExpiry: {
      type: Number,
      default: 0,
    },

    renewalRequired: {
      type: Boolean,
      default: false,
    },

    inspectionRequired: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      default: "Normal",
    },

    documentLocation: {
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

module.exports = mongoose.model("Compliance", complianceSchema);
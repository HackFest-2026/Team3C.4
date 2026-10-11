const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      required: true,
      trim: true,
    },

    workerName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
    },

    month: {
      type: String,
      required: true,
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    overtimePay: {
      type: Number,
      default: 0,
      min: 0,
    },

    allowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    deduction: {
      type: Number,
      default: 0,
      min: 0,
    },

    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      default: "Pending",
    },

    paymentDate: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payroll", payrollSchema);
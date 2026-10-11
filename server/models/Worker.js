const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
    {
        workerId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        // Used for management authentication.
        // For normal workers this is their job designation.
        role: {
            type: String,
            default: "Worker",
            trim: true
        },

        designation: {
            type: String,
            default: "Mining Worker",
            trim: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        shift: {
            type: String,
            enum: [
                "Morning",
                "Afternoon",
                "Night",
                "Evening",
                "General"
            ],
            default: "General"
        },

        zone: {
            type: String,
            required: true,
            default: "Safe Zone"
        },

        currentDuty: {
            type: String,
            default: "General Mining Duty"
        },

        status: {
            type: String,
            enum: [
                "Present",
                "On Leave",
                "Off Duty",
                "Emergency",
                "Active",
                "On Duty"
            ],
            default: "Present"
        },

        attendance: {
            type: Number,
            min: 0,
            max: 100,
            default: 95
        },

        experience: {
            type: String,
            default: "2 Years"
        },

        joiningDate: {
            type: String,
            default: ""
        },

        skillCertification: {
            type: String,
            default: "Mining Safety Certified"
        },

        equipmentAssigned: {
            type: String,
            default: "Standard Mining Equipment"
        },

        ppeStatus: {
            type: String,
            enum: [
                "All PPE Verified",
                "PPE Missing",
                "PPE Inspection Required"
            ],
            default: "All PPE Verified"
        },

        lastSafetyTraining: {
            type: String,
            default: ""
        },

        riskLevel: {
            type: String,
            enum: [
                "Low",
                "Medium",
                "High",
                "Critical"
            ],
            default: "Low"
        },

        gasExposure: {
            type: String,
            enum: [
                "Normal",
                "Warning",
                "High"
            ],
            default: "Normal"
        },

        blastZoneClearance: {
            type: String,
            enum: [
                "Cleared",
                "Pending",
                "Restricted"
            ],
            default: "Cleared"
        },

        lastCheckIn: {
            type: String,
            default: ""
        },

        supervisor: {
            type: String,
            default: ""
        },

        emergencyContact: {
            type: String,
            default: ""
        },

        // face-api.js produces exactly 128 values.
        faceDescriptor: {
            type: [Number],
            default: []
        },

        image: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Worker", workerSchema);
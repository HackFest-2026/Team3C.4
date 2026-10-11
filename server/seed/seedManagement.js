const mongoose = require("mongoose");
require("dotenv").config();
const Worker = require("./models/Worker");

async function seedManagers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for management seed...");

        const sampleDescriptor = Array(128).fill(0).map((_, i) => Math.sin(i * 0.1) * 0.2);

        const managers = [
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
                faceDescriptor: sampleDescriptor
            },
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
                faceDescriptor: sampleDescriptor
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
                faceDescriptor: sampleDescriptor
            }
        ];

        for (const m of managers) {
            await Worker.findOneAndUpdate(
                { workerId: m.workerId },
                m,
                { upsert: true, new: true }
            );
        }

        console.log("Pre-seeded 3 Authorized Management Profiles successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding management:", err);
        process.exit(1);
    }
}

seedManagers();

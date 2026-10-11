const mongoose = require("mongoose");
require("dotenv").config();

const Environment = require("./models/Environment");

const environmentRecords = [
  {
    recordId: "ENV-001",
    date: "2026-09-15",
    time: "08:00",
    zone: "North Pit",
    temperature: 29,
    humidity: 58,
    pm25: 28,
    pm10: 62,
    airQualityIndex: 72,
    airQualityStatus: "Moderate",
    noiseLevel: 78,
    waterQuality: "Normal",
    waterPh: 7.2,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Normal morning conditions"
  },

  {
    recordId: "ENV-002",
    date: "2026-09-15",
    time: "12:00",
    zone: "North Pit",
    temperature: 33,
    humidity: 49,
    pm25: 41,
    pm10: 88,
    airQualityIndex: 96,
    airQualityStatus: "Moderate",
    noiseLevel: 84,
    waterQuality: "Normal",
    waterPh: 7.1,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Medium",
    unusualChange: false,
    remarks: "Increased dust during excavation"
  },

  {
    recordId: "ENV-003",
    date: "2026-09-15",
    time: "16:00",
    zone: "North Pit",
    temperature: 35,
    humidity: 44,
    pm25: 52,
    pm10: 112,
    airQualityIndex: 121,
    airQualityStatus: "Poor",
    noiseLevel: 91,
    waterQuality: "Normal",
    waterPh: 7.0,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Medium",
    unusualChange: true,
    remarks: "Dust level increased above normal trend"
  },

  {
    recordId: "ENV-004",
    date: "2026-09-16",
    time: "08:00",
    zone: "South Pit",
    temperature: 27,
    humidity: 62,
    pm25: 21,
    pm10: 48,
    airQualityIndex: 54,
    airQualityStatus: "Moderate",
    noiseLevel: 73,
    waterQuality: "Normal",
    waterPh: 7.3,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Stable environmental conditions"
  },

  {
    recordId: "ENV-005",
    date: "2026-09-16",
    time: "12:00",
    zone: "South Pit",
    temperature: 32,
    humidity: 51,
    pm25: 34,
    pm10: 74,
    airQualityIndex: 82,
    airQualityStatus: "Moderate",
    noiseLevel: 80,
    waterQuality: "Normal",
    waterPh: 7.2,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Normal mining activity"
  },

  {
    recordId: "ENV-006",
    date: "2026-09-16",
    time: "16:00",
    zone: "South Pit",
    temperature: 34,
    humidity: 46,
    pm25: 46,
    pm10: 98,
    airQualityIndex: 109,
    airQualityStatus: "Poor",
    noiseLevel: 88,
    waterQuality: "Normal",
    waterPh: 7.1,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Medium",
    unusualChange: false,
    remarks: "Higher dust near haul road"
  },

  {
    recordId: "ENV-007",
    date: "2026-09-17",
    time: "08:00",
    zone: "Crusher Area",
    temperature: 28,
    humidity: 55,
    pm25: 36,
    pm10: 82,
    airQualityIndex: 91,
    airQualityStatus: "Moderate",
    noiseLevel: 94,
    waterQuality: "Normal",
    waterPh: 7.0,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Medium",
    unusualChange: false,
    remarks: "Crusher operating normally"
  },

  {
    recordId: "ENV-008",
    date: "2026-09-17",
    time: "12:00",
    zone: "Crusher Area",
    temperature: 31,
    humidity: 48,
    pm25: 58,
    pm10: 126,
    airQualityIndex: 132,
    airQualityStatus: "Poor",
    noiseLevel: 101,
    waterQuality: "Normal",
    waterPh: 6.9,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "High",
    unusualChange: true,
    remarks: "Dust and noise spike detected near crusher"
  },

  {
    recordId: "ENV-009",
    date: "2026-09-17",
    time: "16:00",
    zone: "Crusher Area",
    temperature: 32,
    humidity: 46,
    pm25: 49,
    pm10: 108,
    airQualityIndex: 116,
    airQualityStatus: "Poor",
    noiseLevel: 97,
    waterQuality: "Normal",
    waterPh: 7.0,
    dustSuppression: "Active",
    environmentalProtection: "Review Required",
    riskLevel: "High",
    unusualChange: true,
    remarks: "Environmental controls require inspection"
  },

  {
    recordId: "ENV-010",
    date: "2026-09-18",
    time: "08:00",
    zone: "East Pit",
    temperature: 26,
    humidity: 64,
    pm25: 18,
    pm10: 42,
    airQualityIndex: 42,
    airQualityStatus: "Good",
    noiseLevel: 70,
    waterQuality: "Normal",
    waterPh: 7.4,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Good morning air quality"
  },

  {
    recordId: "ENV-011",
    date: "2026-09-18",
    time: "12:00",
    zone: "East Pit",
    temperature: 30,
    humidity: 52,
    pm25: 29,
    pm10: 65,
    airQualityIndex: 68,
    airQualityStatus: "Moderate",
    noiseLevel: 76,
    waterQuality: "Normal",
    waterPh: 7.3,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Stable conditions"
  },

  {
    recordId: "ENV-012",
    date: "2026-09-18",
    time: "16:00",
    zone: "East Pit",
    temperature: 33,
    humidity: 45,
    pm25: 43,
    pm10: 94,
    airQualityIndex: 102,
    airQualityStatus: "Poor",
    noiseLevel: 86,
    waterQuality: "Normal",
    waterPh: 7.2,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Medium",
    unusualChange: false,
    remarks: "Afternoon dust increase"
  },

  {
    recordId: "ENV-013",
    date: "2026-09-19",
    time: "08:00",
    zone: "West Pit",
    temperature: 27,
    humidity: 60,
    pm25: 22,
    pm10: 51,
    airQualityIndex: 57,
    airQualityStatus: "Moderate",
    noiseLevel: 74,
    waterQuality: "Normal",
    waterPh: 7.2,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Normal conditions"
  },

  {
    recordId: "ENV-014",
    date: "2026-09-19",
    time: "12:00",
    zone: "West Pit",
    temperature: 34,
    humidity: 47,
    pm25: 47,
    pm10: 101,
    airQualityIndex: 111,
    airQualityStatus: "Poor",
    noiseLevel: 89,
    waterQuality: "Normal",
    waterPh: 7.1,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Medium",
    unusualChange: false,
    remarks: "Haul road activity increased dust"
  },

  {
    recordId: "ENV-015",
    date: "2026-09-19",
    time: "16:00",
    zone: "West Pit",
    temperature: 36,
    humidity: 42,
    pm25: 67,
    pm10: 142,
    airQualityIndex: 151,
    airQualityStatus: "Poor",
    noiseLevel: 96,
    waterQuality: "Normal",
    waterPh: 6.8,
    dustSuppression: "Needs Inspection",
    environmentalProtection: "Review Required",
    riskLevel: "High",
    unusualChange: true,
    remarks: "Significant environmental parameter increase"
  },

  {
    recordId: "ENV-016",
    date: "2026-09-20",
    time: "08:00",
    zone: "Water Treatment Area",
    temperature: 25,
    humidity: 68,
    pm25: 16,
    pm10: 37,
    airQualityIndex: 35,
    airQualityStatus: "Good",
    noiseLevel: 61,
    waterQuality: "Normal",
    waterPh: 7.5,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Water treatment area operating normally"
  },

  {
    recordId: "ENV-017",
    date: "2026-09-20",
    time: "12:00",
    zone: "Water Treatment Area",
    temperature: 29,
    humidity: 59,
    pm25: 19,
    pm10: 44,
    airQualityIndex: 46,
    airQualityStatus: "Good",
    noiseLevel: 64,
    waterQuality: "Normal",
    waterPh: 7.4,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Water and air parameters stable"
  },

  {
    recordId: "ENV-018",
    date: "2026-09-21",
    time: "08:00",
    zone: "Waste Storage Area",
    temperature: 28,
    humidity: 61,
    pm25: 31,
    pm10: 70,
    airQualityIndex: 75,
    airQualityStatus: "Moderate",
    noiseLevel: 67,
    waterQuality: "Normal",
    waterPh: 7.1,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Waste storage conditions normal"
  },

  {
    recordId: "ENV-019",
    date: "2026-09-21",
    time: "12:00",
    zone: "Waste Storage Area",
    temperature: 32,
    humidity: 50,
    pm25: 39,
    pm10: 84,
    airQualityIndex: 88,
    airQualityStatus: "Moderate",
    noiseLevel: 71,
    waterQuality: "Normal",
    waterPh: 7.0,
    dustSuppression: "Active",
    environmentalProtection: "Compliant",
    riskLevel: "Low",
    unusualChange: false,
    remarks: "Stable waste storage conditions"
  },

  {
    recordId: "ENV-020",
    date: "2026-09-21",
    time: "16:00",
    zone: "Waste Storage Area",
    temperature: 35,
    humidity: 43,
    pm25: 55,
    pm10: 119,
    airQualityIndex: 128,
    airQualityStatus: "Poor",
    noiseLevel: 79,
    waterQuality: "Normal",
    waterPh: 6.9,
    dustSuppression: "Needs Inspection",
    environmentalProtection: "Review Required",
    riskLevel: "High",
    unusualChange: true,
    remarks: "Dust increase detected around waste storage area"
  }
];

async function seedEnvironment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await Environment.deleteMany({});

    await Environment.insertMany(environmentRecords);

    console.log("20 environment records inserted successfully");

    await mongoose.connection.close();

    console.log("MongoDB Connection Closed");
  } catch (error) {
    console.error("Environment seed error:", error);
    process.exit(1);
  }
}

seedEnvironment();
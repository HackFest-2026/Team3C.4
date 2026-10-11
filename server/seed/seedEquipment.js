const mongoose = require("mongoose");
require("dotenv").config();

const Equipment = require("./models/Equipment");

const equipment = [
  {
    equipmentId: "EQ-001",
    equipmentName: "Hydraulic Excavator",
    equipmentType: "Excavator",
    brand: "Caterpillar",
    model: "320D",
    department: "Mining Operations",
    currentLocation: "North Pit",
    assignedWorkerId: "MG-W001",
    assignedWorkerName: "Ravi Kumar",
    status: "Operational",
    maintenanceResponsible: "Maintenance Team A",
    maintenanceStatus: "Up to Date",
    fuelLevel: 82,
    operatingHours: 4520,
    purchaseCost: 8500000,
    lastMaintenanceDate: "2026-09-15",
    nextMaintenanceDate: "2026-10-15",
    securityStatus: "Secured",
    notes: "Primary excavation equipment"
  },

  {
    equipmentId: "EQ-002",
    equipmentName: "Wheel Loader",
    equipmentType: "Loader",
    brand: "Komatsu",
    model: "WA380",
    department: "Mining Operations",
    currentLocation: "Crusher Area",
    assignedWorkerId: "MG-W002",
    assignedWorkerName: "Manoj Singh",
    status: "Operational",
    maintenanceResponsible: "Maintenance Team A",
    maintenanceStatus: "Up to Date",
    fuelLevel: 74,
    operatingHours: 3280,
    purchaseCost: 6200000,
    lastMaintenanceDate: "2026-09-10",
    nextMaintenanceDate: "2026-10-10",
    securityStatus: "Secured",
    notes: "Material loading operations"
  },

  {
    equipmentId: "EQ-003",
    equipmentName: "Dump Truck",
    equipmentType: "Haul Truck",
    brand: "Volvo",
    model: "FMX",
    department: "Transportation",
    currentLocation: "South Haul Road",
    assignedWorkerId: "MG-W003",
    assignedWorkerName: "Kiran Shetty",
    status: "Operational",
    maintenanceResponsible: "Maintenance Team B",
    maintenanceStatus: "Inspection Due",
    fuelLevel: 61,
    operatingHours: 5140,
    purchaseCost: 7200000,
    lastMaintenanceDate: "2026-08-28",
    nextMaintenanceDate: "2026-10-05",
    securityStatus: "Secured",
    notes: "Heavy material transportation"
  },

  {
    equipmentId: "EQ-004",
    equipmentName: "Drilling Machine",
    equipmentType: "Drill",
    brand: "Sandvik",
    model: "DX800",
    department: "Drilling",
    currentLocation: "East Pit",
    assignedWorkerId: "MG-W004",
    assignedWorkerName: "Suresh Gowda",
    status: "Operational",
    maintenanceResponsible: "Maintenance Team B",
    maintenanceStatus: "Up to Date",
    fuelLevel: 68,
    operatingHours: 2870,
    purchaseCost: 9800000,
    lastMaintenanceDate: "2026-09-18",
    nextMaintenanceDate: "2026-10-18",
    securityStatus: "Secured",
    notes: "Rock drilling operations"
  },

  {
    equipmentId: "EQ-005",
    equipmentName: "Bulldozer",
    equipmentType: "Dozer",
    brand: "Caterpillar",
    model: "D6T",
    department: "Mining Operations",
    currentLocation: "Overburden Area",
    assignedWorkerId: "MG-W005",
    assignedWorkerName: "Ramesh Naik",
    status: "Operational",
    maintenanceResponsible: "Maintenance Team C",
    maintenanceStatus: "Up to Date",
    fuelLevel: 79,
    operatingHours: 3920,
    purchaseCost: 7600000,
    lastMaintenanceDate: "2026-09-05",
    nextMaintenanceDate: "2026-10-05",
    securityStatus: "Secured",
    notes: "Overburden movement"
  },

  {
    equipmentId: "EQ-006",
    equipmentName: "Water Tanker",
    equipmentType: "Tanker",
    brand: "Tata",
    model: "Prima",
    department: "Environment",
    currentLocation: "Water Station",
    assignedWorkerId: "MG-W006",
    assignedWorkerName: "Mahesh Kumar",
    status: "Operational",
    maintenanceResponsible: "Utility Team",
    maintenanceStatus: "Up to Date",
    fuelLevel: 88,
    operatingHours: 1760,
    purchaseCost: 2800000,
    lastMaintenanceDate: "2026-09-20",
    nextMaintenanceDate: "2026-10-20",
    securityStatus: "Secured",
    notes: "Dust suppression and water management"
  },

  {
    equipmentId: "EQ-007",
    equipmentName: "Crusher Unit",
    equipmentType: "Crusher",
    brand: "Metso",
    model: "LT106",
    department: "Processing",
    currentLocation: "Crusher Plant",
    assignedWorkerId: "",
    assignedWorkerName: "",
    status: "Operational",
    maintenanceResponsible: "Plant Maintenance Team",
    maintenanceStatus: "Up to Date",
    fuelLevel: 100,
    operatingHours: 6840,
    purchaseCost: 12500000,
    lastMaintenanceDate: "2026-09-12",
    nextMaintenanceDate: "2026-10-12",
    securityStatus: "Secured",
    notes: "Primary material crushing unit"
  },

  {
    equipmentId: "EQ-008",
    equipmentName: "Conveyor System",
    equipmentType: "Conveyor",
    brand: "Metso",
    model: "CV-500",
    department: "Processing",
    currentLocation: "Crusher Plant",
    assignedWorkerId: "",
    assignedWorkerName: "",
    status: "Operational",
    maintenanceResponsible: "Plant Maintenance Team",
    maintenanceStatus: "Up to Date",
    fuelLevel: 100,
    operatingHours: 7120,
    purchaseCost: 4800000,
    lastMaintenanceDate: "2026-09-08",
    nextMaintenanceDate: "2026-10-08",
    securityStatus: "Secured",
    notes: "Material transportation system"
  },

  {
    equipmentId: "EQ-009",
    equipmentName: "Generator",
    equipmentType: "Power Generator",
    brand: "Cummins",
    model: "C275D5",
    department: "Electrical",
    currentLocation: "Power Station",
    assignedWorkerId: "",
    assignedWorkerName: "",
    status: "Operational",
    maintenanceResponsible: "Electrical Team",
    maintenanceStatus: "Up to Date",
    fuelLevel: 65,
    operatingHours: 2310,
    purchaseCost: 3200000,
    lastMaintenanceDate: "2026-09-22",
    nextMaintenanceDate: "2026-10-22",
    securityStatus: "Secured",
    notes: "Backup power generation"
  },

  {
    equipmentId: "EQ-010",
    equipmentName: "Service Pickup",
    equipmentType: "Utility Vehicle",
    brand: "Toyota",
    model: "Hilux",
    department: "Maintenance",
    currentLocation: "Workshop",
    assignedWorkerId: "MG-W010",
    assignedWorkerName: "Prakash Rao",
    status: "Operational",
    maintenanceResponsible: "Workshop Team",
    maintenanceStatus: "Up to Date",
    fuelLevel: 71,
    operatingHours: 1450,
    purchaseCost: 2100000,
    lastMaintenanceDate: "2026-09-16",
    nextMaintenanceDate: "2026-10-16",
    securityStatus: "Secured",
    notes: "Maintenance team transportation"
  },

  {
    equipmentId: "EQ-011",
    equipmentName: "Air Compressor",
    equipmentType: "Compressor",
    brand: "Atlas Copco",
    model: "XAS",
    department: "Drilling",
    currentLocation: "East Pit",
    assignedWorkerId: "",
    assignedWorkerName: "",
    status: "Operational",
    maintenanceResponsible: "Maintenance Team B",
    maintenanceStatus: "Inspection Due",
    fuelLevel: 57,
    operatingHours: 3640,
    purchaseCost: 2600000,
    lastMaintenanceDate: "2026-08-30",
    nextMaintenanceDate: "2026-10-04",
    securityStatus: "Secured",
    notes: "Compressed air supply"
  },

  {
    equipmentId: "EQ-012",
    equipmentName: "Mobile Lighting Tower",
    equipmentType: "Lighting",
    brand: "Generac",
    model: "MLT",
    department: "Safety",
    currentLocation: "South Pit",
    assignedWorkerId: "",
    assignedWorkerName: "",
    status: "Operational",
    maintenanceResponsible: "Electrical Team",
    maintenanceStatus: "Up to Date",
    fuelLevel: 76,
    operatingHours: 1980,
    purchaseCost: 950000,
    lastMaintenanceDate: "2026-09-14",
    nextMaintenanceDate: "2026-10-14",
    securityStatus: "Secured",
    notes: "Night shift illumination"
  },

  {
    equipmentId: "EQ-013",
    equipmentName: "Rock Breaker",
    equipmentType: "Breaker",
    brand: "Hyundai",
    model: "HB-Series",
    department: "Mining Operations",
    currentLocation: "West Pit",
    assignedWorkerId: "MG-W013",
    assignedWorkerName: "Vijay Kumar",
    status: "Maintenance",
    maintenanceResponsible: "Maintenance Team C",
    maintenanceStatus: "Under Maintenance",
    fuelLevel: 42,
    operatingHours: 4290,
    purchaseCost: 1800000,
    lastMaintenanceDate: "2026-09-25",
    nextMaintenanceDate: "2026-10-03",
    securityStatus: "Secured",
    notes: "Hydraulic breaker under service"
  },

  {
    equipmentId: "EQ-014",
    equipmentName: "Excavator",
    equipmentType: "Excavator",
    brand: "Hitachi",
    model: "ZX350",
    department: "Mining Operations",
    currentLocation: "West Pit",
    assignedWorkerId: "MG-W014",
    assignedWorkerName: "Ganesh Bhat",
    status: "Operational",
    maintenanceResponsible: "Maintenance Team A",
    maintenanceStatus: "Up to Date",
    fuelLevel: 83,
    operatingHours: 3780,
    purchaseCost: 7900000,
    lastMaintenanceDate: "2026-09-19",
    nextMaintenanceDate: "2026-10-19",
    securityStatus: "Secured",
    notes: "Secondary excavation unit"
  },

  {
    equipmentId: "EQ-015",
    equipmentName: "Emergency Response Vehicle",
    equipmentType: "Emergency Vehicle",
    brand: "Mahindra",
    model: "Bolero",
    department: "Safety",
    currentLocation: "Safety Control Room",
    assignedWorkerId: "",
    assignedWorkerName: "",
    status: "Operational",
    maintenanceResponsible: "Safety Team",
    maintenanceStatus: "Up to Date",
    fuelLevel: 91,
    operatingHours: 980,
    purchaseCost: 1500000,
    lastMaintenanceDate: "2026-09-21",
    nextMaintenanceDate: "2026-10-21",
    securityStatus: "Secured",
    notes: "Emergency response and rescue support"
  }
];

async function seedEquipment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await Equipment.deleteMany({});

    await Equipment.insertMany(equipment);

    console.log("15 equipment records inserted successfully");

    await mongoose.connection.close();
    console.log("MongoDB Connection Closed");

  } catch (error) {
    console.error("Equipment seed error:", error);
    process.exit(1);
  }
}

seedEquipment();
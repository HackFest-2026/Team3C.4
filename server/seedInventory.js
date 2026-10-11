const mongoose = require("mongoose");
require("dotenv").config();

const Inventory = require("./models/Inventory");

const inventory = [
  {
    itemId: "INV-001",
    itemName: "Safety Helmet",
    category: "PPE",
    description: "Industrial safety helmet for mine workers",
    quantity: 85,
    unit: "Units",
    minimumStockLevel: 30,
    storageLocation: "PPE Store Room",
    supplier: "SafeMine Supplies",
    unitCost: 850,
    totalValue: 72250,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-15",
    expiryDate: "2030-09-15",
    responsiblePerson: "Safety Officer",
    notes: "Mandatory PPE"
  },

  {
    itemId: "INV-002",
    itemName: "Safety Shoes",
    category: "PPE",
    description: "Steel toe mining safety shoes",
    quantity: 64,
    unit: "Pairs",
    minimumStockLevel: 25,
    storageLocation: "PPE Store Room",
    supplier: "SafeMine Supplies",
    unitCost: 1800,
    totalValue: 115200,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-12",
    expiryDate: "",
    responsiblePerson: "Safety Officer",
    notes: "Steel toe protection"
  },

  {
    itemId: "INV-003",
    itemName: "Safety Gloves",
    category: "PPE",
    description: "Heavy duty protective gloves",
    quantity: 120,
    unit: "Pairs",
    minimumStockLevel: 50,
    storageLocation: "PPE Store Room",
    supplier: "Industrial Safety India",
    unitCost: 250,
    totalValue: 30000,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-20",
    expiryDate: "",
    responsiblePerson: "Safety Officer",
    notes: "Hand protection"
  },

  {
    itemId: "INV-004",
    itemName: "Dust Mask",
    category: "Respiratory Protection",
    description: "Disposable dust protection mask",
    quantity: 180,
    unit: "Units",
    minimumStockLevel: 80,
    storageLocation: "PPE Store Room",
    supplier: "RespiraSafe",
    unitCost: 45,
    totalValue: 8100,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-22",
    expiryDate: "2028-09-22",
    responsiblePerson: "Safety Officer",
    notes: "Dust protection"
  },

  {
    itemId: "INV-005",
    itemName: "Respirator",
    category: "Respiratory Protection",
    description: "Reusable industrial respirator",
    quantity: 38,
    unit: "Units",
    minimumStockLevel: 15,
    storageLocation: "Safety Equipment Room",
    supplier: "RespiraSafe",
    unitCost: 2200,
    totalValue: 83600,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-08-30",
    expiryDate: "2029-08-30",
    responsiblePerson: "Safety Officer",
    notes: "Used for high dust zones"
  },

  {
    itemId: "INV-006",
    itemName: "Reflective Safety Vest",
    category: "PPE",
    description: "High visibility reflective vest",
    quantity: 92,
    unit: "Units",
    minimumStockLevel: 30,
    storageLocation: "PPE Store Room",
    supplier: "SafeMine Supplies",
    unitCost: 450,
    totalValue: 41400,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-10",
    expiryDate: "",
    responsiblePerson: "Safety Officer",
    notes: "High visibility workwear"
  },

  {
    itemId: "INV-007",
    itemName: "Safety Goggles",
    category: "Eye Protection",
    description: "Industrial protective goggles",
    quantity: 76,
    unit: "Units",
    minimumStockLevel: 25,
    storageLocation: "PPE Store Room",
    supplier: "Vision Safety",
    unitCost: 320,
    totalValue: 24320,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-14",
    expiryDate: "",
    responsiblePerson: "Safety Officer",
    notes: "Eye protection"
  },

  {
    itemId: "INV-008",
    itemName: "Ear Protection",
    category: "Hearing Protection",
    description: "Industrial hearing protection earmuffs",
    quantity: 48,
    unit: "Units",
    minimumStockLevel: 20,
    storageLocation: "Safety Equipment Room",
    supplier: "NoiseSafe Industries",
    unitCost: 650,
    totalValue: 31200,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-05",
    expiryDate: "",
    responsiblePerson: "Safety Officer",
    notes: "Required near crusher area"
  },

  {
    itemId: "INV-009",
    itemName: "First Aid Kit",
    category: "Medical",
    description: "Complete industrial first aid kit",
    quantity: 12,
    unit: "Kits",
    minimumStockLevel: 5,
    storageLocation: "Safety Control Room",
    supplier: "MediCare Industrial",
    unitCost: 2800,
    totalValue: 33600,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-18",
    expiryDate: "2028-09-18",
    responsiblePerson: "Safety Officer",
    notes: "Emergency medical supplies"
  },

  {
    itemId: "INV-010",
    itemName: "Fire Extinguisher",
    category: "Emergency",
    description: "ABC type fire extinguisher",
    quantity: 24,
    unit: "Units",
    minimumStockLevel: 10,
    storageLocation: "Emergency Equipment Store",
    supplier: "FireSafe Systems",
    unitCost: 3200,
    totalValue: 76800,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-08-25",
    expiryDate: "2028-08-25",
    responsiblePerson: "Safety Officer",
    notes: "Emergency fire protection"
  },

  {
    itemId: "INV-011",
    itemName: "Hydraulic Oil",
    category: "Lubricants",
    description: "Hydraulic oil for heavy mining equipment",
    quantity: 420,
    unit: "Litres",
    minimumStockLevel: 150,
    storageLocation: "Lubricant Store",
    supplier: "Industrial Lubricants Ltd",
    unitCost: 180,
    totalValue: 75600,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-16",
    expiryDate: "2029-09-16",
    responsiblePerson: "Maintenance Manager",
    notes: "For hydraulic systems"
  },

  {
    itemId: "INV-012",
    itemName: "Engine Oil",
    category: "Lubricants",
    description: "Heavy duty diesel engine oil",
    quantity: 350,
    unit: "Litres",
    minimumStockLevel: 120,
    storageLocation: "Lubricant Store",
    supplier: "Industrial Lubricants Ltd",
    unitCost: 210,
    totalValue: 73500,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-10",
    expiryDate: "2029-09-10",
    responsiblePerson: "Maintenance Manager",
    notes: "Heavy equipment engines"
  },

  {
    itemId: "INV-013",
    itemName: "Diesel Fuel",
    category: "Fuel",
    description: "Diesel fuel for mining vehicles",
    quantity: 6800,
    unit: "Litres",
    minimumStockLevel: 2500,
    storageLocation: "Fuel Storage Area",
    supplier: "Industrial Fuel Services",
    unitCost: 92,
    totalValue: 625600,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-28",
    expiryDate: "",
    responsiblePerson: "Fuel Manager",
    notes: "Daily mining operations"
  },

  {
    itemId: "INV-014",
    itemName: "Conveyor Belt Spare",
    category: "Spare Parts",
    description: "Replacement conveyor belt section",
    quantity: 8,
    unit: "Sections",
    minimumStockLevel: 3,
    storageLocation: "Mechanical Store",
    supplier: "Mining Spares India",
    unitCost: 18500,
    totalValue: 148000,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-08-20",
    expiryDate: "",
    responsiblePerson: "Maintenance Manager",
    notes: "Crusher conveyor spare"
  },

  {
    itemId: "INV-015",
    itemName: "Hydraulic Hose",
    category: "Spare Parts",
    description: "Heavy duty hydraulic replacement hose",
    quantity: 14,
    unit: "Units",
    minimumStockLevel: 8,
    storageLocation: "Mechanical Store",
    supplier: "Mining Spares India",
    unitCost: 4200,
    totalValue: 58800,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-01",
    expiryDate: "",
    responsiblePerson: "Maintenance Manager",
    notes: "Excavator and loader spare"
  },

  {
    itemId: "INV-016",
    itemName: "Drill Bit",
    category: "Mining Tools",
    description: "Rock drilling replacement bit",
    quantity: 18,
    unit: "Units",
    minimumStockLevel: 10,
    storageLocation: "Drilling Store",
    supplier: "DrillTech Supplies",
    unitCost: 7800,
    totalValue: 140400,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-08",
    expiryDate: "",
    responsiblePerson: "Drilling Supervisor",
    notes: "Rock drilling consumable"
  },

  {
    itemId: "INV-017",
    itemName: "Steel Cable",
    category: "Mining Tools",
    description: "Heavy duty steel cable",
    quantity: 6,
    unit: "Rolls",
    minimumStockLevel: 3,
    storageLocation: "Mechanical Store",
    supplier: "Mining Spares India",
    unitCost: 14500,
    totalValue: 87000,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-08-28",
    expiryDate: "",
    responsiblePerson: "Maintenance Manager",
    notes: "Heavy equipment support"
  },

  {
    itemId: "INV-018",
    itemName: "Spare Tyre",
    category: "Vehicle Parts",
    description: "Heavy mining vehicle tyre",
    quantity: 5,
    unit: "Units",
    minimumStockLevel: 4,
    storageLocation: "Vehicle Workshop",
    supplier: "Heavy Tyres India",
    unitCost: 32000,
    totalValue: 160000,
    stockStatus: "Low Stock",
    lastRestockedDate: "2026-08-15",
    expiryDate: "",
    responsiblePerson: "Workshop Manager",
    notes: "Truck and utility vehicle spare"
  },

  {
    itemId: "INV-019",
    itemName: "LED Work Light",
    category: "Electrical",
    description: "Rechargeable industrial work light",
    quantity: 34,
    unit: "Units",
    minimumStockLevel: 15,
    storageLocation: "Electrical Store",
    supplier: "Industrial Electricals",
    unitCost: 1250,
    totalValue: 42500,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-03",
    expiryDate: "",
    responsiblePerson: "Electrical Supervisor",
    notes: "Night shift maintenance"
  },

  {
    itemId: "INV-020",
    itemName: "Emergency Drinking Water",
    category: "Emergency Supplies",
    description: "Packaged drinking water for emergency stock",
    quantity: 240,
    unit: "Bottles",
    minimumStockLevel: 100,
    storageLocation: "Emergency Store",
    supplier: "AquaSafe Supplies",
    unitCost: 25,
    totalValue: 6000,
    stockStatus: "In Stock",
    lastRestockedDate: "2026-09-25",
    expiryDate: "2027-03-25",
    responsiblePerson: "Safety Officer",
    notes: "Emergency reserve"
  }
];

async function seedInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await Inventory.deleteMany({});

    await Inventory.insertMany(inventory);

    console.log("20 inventory records inserted successfully");

    await mongoose.connection.close();

    console.log("MongoDB Connection Closed");
  } catch (error) {
    console.error("Inventory seed error:", error);
    process.exit(1);
  }
}

seedInventory();
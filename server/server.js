const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

// Route Modules
const healthRoutes = require("./routes/healthRoutes");
const workerRoutes = require("./routes/workerRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const environmentRoutes = require("./routes/environmentRoutes");
const wasteRoutes = require("./routes/wasteRoutes");
const financeRoutes = require("./routes/financeRoutes");
const complianceRoutes = require("./routes/complianceRoutes");
const aiRoutes = require("./routes/aiRoutes");
const hardwareRoutes = require("./routes/hardwareRoutes");
const authRoutes = require("./routes/authRoutes");
const edgeRoutes = require("./routes/edgeRoutes");
const ppeRoutes = require("./routes/ppeRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Connect Database
connectDB();

// Root Info Endpoint
app.get("/", (req, res) => {
  res.json({
    message: "MineGuard Server is Running",
    service: "MineGuard Intelligent Mining Platform",
    version: "2.0.0",
    healthCheck: "/api/health",
    apiDocs: "Import postman/MineGuard.postman_collection.json"
  });
});

// Mount API Routes
app.use("/api", healthRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/environment", environmentRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/ai-intelligence", aiRoutes);
app.use("/api/hardware", hardwareRoutes);
app.use("/api/edge", edgeRoutes);
app.use("/api/ppe", ppeRoutes);
app.use("/api", authRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Server Start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[MineGuard Server] Running on http://localhost:${PORT}`);
});

module.exports = app;
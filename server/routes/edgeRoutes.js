const express = require("express");
const router = express.Router();
const { edgeService } = require("../services/edgeIntelligence");

// Array of connected SSE response streams
const sseClients = new Set();

/**
 * Broadcast event to all open SSE connections
 */
function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// GET /api/edge/status - Edge node operational health & hazard summary
router.get("/status", (req, res) => {
  try {
    const status = edgeService.getEdgeStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/edge/map - Underground mine graph topology with live tunnel states & worker positions
router.get("/map", (req, res) => {
  try {
    const mapData = edgeService.getMapGraph();
    res.json({
      success: true,
      ...mapData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/telemetry - Sensor ingestion from Python USB Serial Collector / ESP32 Node
router.post("/telemetry", (req, res) => {
  try {
    const telemetry = req.body;
    const result = edgeService.processTelemetry(telemetry);

    // Notify any listening SSE streams
    broadcastSSE("telemetry", result);
    if (result.statusChanged) {
      broadcastSSE("hazard_update", {
        tunnelId: result.targetTunnelId,
        status: result.tunnelStatus,
        hazardType: result.hazardType,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/edge/route - Get safe evacuation route for specific worker (default W-104)
router.get("/route", (req, res) => {
  try {
    const workerId = req.query.workerId || "W-104";
    const route = edgeService.getWorkerRoute(workerId);
    res.json({
      success: true,
      ...route,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/route/calculate - On-demand route calculation for arbitrary start node
router.post("/route/calculate", (req, res) => {
  try {
    const { startNodeId = "WORK_FACE_A", options = {} } = req.body;
    const route = edgeService.routeEngine.findSafestRoute(startNodeId, options);
    res.json({
      success: true,
      ...route,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/simulate-scenario - Run predefined test scenarios (A through G)
router.post("/simulate-scenario", (req, res) => {
  try {
    const { scenario = "NORMAL" } = req.body;
    const result = edgeService.applyScenario(scenario);

    broadcastSSE("scenario_change", result);

    res.json({
      success: true,
      message: `Scenario '${scenario}' applied successfully`,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/reset-simulation - Reset simulation and restore live sensor mode
router.post("/reset-simulation", (req, res) => {
  try {
    edgeService.resetSimulation();
    broadcastSSE("simulation_reset", { isSimulatedMode: false });
    res.json({
      success: true,
      message: "Simulation cleared. Edge module restored to live telemetry mode.",
      isSimulatedMode: false,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/reset-hazards - Reset all physical and simulated hazards to clean safe defaults
router.post("/reset-hazards", (req, res) => {
  try {
    if (edgeService.clearAllPhysicalHazards) {
      edgeService.clearAllPhysicalHazards();
    } else {
      edgeService.resetSimulation();
    }
    broadcastSSE("simulation_reset", { isSimulatedMode: false });
    res.json({
      success: true,
      message: "All hazards flushed. Mine tunnels restored to clean safe state.",
      isSimulatedMode: false,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/sos - Trigger emergency SOS distress beacon
router.post("/sos", (req, res) => {
  try {
    const { workerId = "W-104", details = "Manual panic trigger" } = req.body;
    const ok = edgeService.triggerSOS(workerId, details);

    broadcastSSE("sos_alert", { workerId, details });

    res.json({
      success: ok,
      workerId,
      message: "SOS alert broadcast to central safety console.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/sos/ack - Acknowledge emergency SOS
router.post("/sos/ack", (req, res) => {
  try {
    const { workerId = "W-104" } = req.body;
    const ok = edgeService.acknowledgeSOS(workerId);

    broadcastSSE("sos_ack", { workerId });

    res.json({
      success: ok,
      workerId,
      message: "SOS emergency signal acknowledged.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/edge/worker-location - Update worker node location
router.post("/worker-location", (req, res) => {
  try {
    const { workerId = "W-104", nodeId = "WORK_FACE_A" } = req.body;
    const ok = edgeService.updateWorkerLocation(workerId, nodeId);
    const updatedRoute = edgeService.getWorkerRoute(workerId);

    broadcastSSE("worker_moved", { workerId, nodeId, updatedRoute });

    res.json({
      success: ok,
      workerId,
      nodeId,
      route: updatedRoute,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/edge/events - Recent emergency events and hazard history
router.get("/events", (req, res) => {
  try {
    res.json({
      success: true,
      alerts: edgeService.emergencyAlerts,
      events: edgeService.recentEvents,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/edge/stream - Real-time Server-Sent Events (SSE) for low-overhead push
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial state handshake
  const initial = {
    type: "INIT",
    status: edgeService.getEdgeStatus(),
    route: edgeService.getWorkerRoute("W-104"),
  };
  res.write(`data: ${JSON.stringify(initial)}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

module.exports = router;

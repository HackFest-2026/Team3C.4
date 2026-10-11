const express = require("express");
const router = express.Router();
const { edgeService } = require("../services/edgeIntelligence");

// In-Memory Telemetry State
let latestHardwareTelemetry = {
  deviceId: "ESP32-MINE-NODE-01",
  flameDetected: false,
  gasPpm: 88,
  gasLevel: "NORMAL",
  distanceCm: 120.5,
  proximityAlert: false,
  buzzerActive: false,
  status: "NORMAL",
  connected: false,
  lastUpdated: new Date().toISOString()
};

const hardwareTelemetryHistory = [];
const hardwareAlerts = [];
let remoteBuzzerCommand = false;

// State tracking to prevent duplicate alerts on continuous readings
let lastFlameActive = false;
let lastGasCritActive = false;
let lastGasWarnActive = false;
let lastProxActive = false;

// POST /api/hardware/telemetry
router.post("/telemetry", (req, res) => {
  try {
    const deviceId = req.body.deviceId || req.body.device_id || "ESP32-MINE-NODE-01";
    const flameTunnel = "TUNNEL-2";
    const gasTunnel = "TUNNEL-10";
    const proxTunnel = "TUNNEL-6";

    const isFlame = Boolean(req.body.flameDetected !== undefined ? req.body.flameDetected : (req.body.flame_detected !== undefined ? req.body.flame_detected : req.body.flame));
    const ppm = Number(req.body.gasPpm !== undefined ? req.body.gasPpm : (req.body.mq135_value !== undefined ? req.body.mq135_value : (req.body.gas !== undefined ? req.body.gas : 50))) || 50;
    const dist = Number(req.body.distanceCm !== undefined ? req.body.distanceCm : (req.body.distance_cm !== undefined ? req.body.distance_cm : (req.body.distance !== undefined ? req.body.distance : 150.0))) || 150.0;
    const mq4Val = req.body.mq4Value !== undefined ? req.body.mq4Value : req.body.mq4_value;
    const isSimulated = Boolean(req.body.isSimulated);
    const gasLevel = req.body.gasLevel;
    const status = req.body.status;
    const buzzerActive = req.body.buzzerActive;

    // Diagnostic logging per requirements
    console.log(`[API] Sensor event received`);
    console.log(`[SENSOR] Flame sensor reading received: ${isFlame}`);
    console.log(`[SENSOR] Gas sensor reading received: ${ppm} PPM`);
    console.log(`[SENSOR] Ultrasonic distance received: ${dist} cm`);
    console.log(`[SENSOR] Assigned tunnel: TUNNEL-2 / TUNNEL-10 / TUNNEL-6`);

    const isGasCrit = ppm >= 320;
    const isGasWarn = ppm >= 180 && ppm < 320;
    const isProx = dist < 25.0 && dist >= 1.0;

    let computedStatus = "NORMAL";
    if (isFlame) {
      computedStatus = "FIRE DETECTED";
    } else if (isGasCrit) {
      computedStatus = "GAS LEVEL CRITICAL";
    } else if (isGasWarn) {
      computedStatus = "GAS DETECTED";
    } else if (isProx) {
      computedStatus = "OBJECT DETECTED";
    }

    latestHardwareTelemetry = {
      deviceId,
      tunnelId: "TUNNEL-2", // Default node anchor
      flameTunnel,
      gasTunnel,
      proxTunnel,
      flameDetected: isFlame,
      gasPpm: ppm,
      mq4Value: mq4Val,
      gasLevel: gasLevel || (isGasCrit ? "CRITICAL" : isGasWarn ? "WARNING" : "NORMAL"),
      distanceCm: dist,
      proximityAlert: isProx,
      buzzerActive: Boolean(buzzerActive || remoteBuzzerCommand || isFlame || isGasCrit),
      status: status || computedStatus,
      connected: true,
      connectionStatus: "ONLINE",
      isSimulated,
      lastUpdated: new Date().toISOString(),
      sensors: {
        flame: {
          tunnelId: flameTunnel,
          active: isFlame,
          status: isFlame ? "FIRE DETECTED" : "NORMAL",
        },
        gas: {
          tunnelId: gasTunnel,
          ppm,
          active: isGasCrit || isGasWarn,
          status: isGasCrit ? "CRITICAL" : isGasWarn ? "WARNING" : "NORMAL",
        },
        ultrasonic: {
          tunnelId: proxTunnel,
          distanceCm: dist,
          active: isProx,
          status: isProx ? "OBJECT DETECTED" : "NORMAL",
        },
      },
    };

    // Forward to Edge Emergency Intelligence module with explicit sensor mappings
    edgeService.processTelemetry({
      deviceId,
      flameDetected: isFlame,
      gasPpm: ppm,
      mq4Value: mq4Val,
      distanceCm: dist,
      isSimulated,
      buzzerActive: latestHardwareTelemetry.buzzerActive,
      status: latestHardwareTelemetry.status,
      sensorMappings: {
        flame: "T2",
        mq135: "T10",
        ultrasonic: "T6",
      },
    });

    // Keep rolling history of last 60 points
    hardwareTelemetryHistory.push({
      timestamp: new Date().toLocaleTimeString(),
      gasPpm: ppm,
      distanceCm: dist,
      flameDetected: isFlame,
      buzzerActive: latestHardwareTelemetry.buzzerActive,
    });

    if (hardwareTelemetryHistory.length > 60) {
      hardwareTelemetryHistory.shift();
    }

    // Safety incident logging with duplicate suppression for active continuous conditions
    if (isFlame) {
      if (!lastFlameActive) {
        hardwareAlerts.unshift({
          id: "ALERT-" + Date.now(),
          timestamp: new Date().toISOString(),
          type: "FIRE_ALARM",
          severity: "CRITICAL",
          tunnelId: flameTunnel,
          title: "FIRE DETECTED — TUNNEL-2",
          details: `Flame sensor triggered on ${deviceId} in ${flameTunnel}. Immediate evacuation recommended.`,
        });
      }
      lastFlameActive = true;
    } else {
      lastFlameActive = false;
    }

    if (isGasCrit) {
      if (!lastGasCritActive) {
        hardwareAlerts.unshift({
          id: "ALERT-" + Date.now(),
          timestamp: new Date().toISOString(),
          type: "GAS_HAZARD",
          severity: "CRITICAL",
          tunnelId: gasTunnel,
          title: "GAS LEVEL CRITICAL — TUNNEL-10",
          details: `MQ-135 gas sensor measured ${ppm} PPM in ${gasTunnel} (> 320 PPM threshold). Immediate evacuation recommended.`,
        });
      }
      lastGasCritActive = true;
      lastGasWarnActive = false;
    } else if (isGasWarn) {
      if (!lastGasWarnActive && !lastGasCritActive) {
        hardwareAlerts.unshift({
          id: "ALERT-" + Date.now(),
          timestamp: new Date().toISOString(),
          type: "GAS_WARNING",
          severity: "WARNING",
          tunnelId: gasTunnel,
          title: "GAS DETECTED — TUNNEL-10",
          details: `MQ-135 gas sensor measured ${ppm} PPM in ${gasTunnel} (Caution threshold 180 PPM exceeded).`,
        });
      }
      lastGasWarnActive = true;
      lastGasCritActive = false;
    } else {
      lastGasCritActive = false;
      lastGasWarnActive = false;
    }

    if (isProx) {
      if (!lastProxActive) {
        hardwareAlerts.unshift({
          id: "ALERT-" + Date.now(),
          timestamp: new Date().toISOString(),
          type: "OBSTACLE_HAZARD",
          severity: "HIGH",
          tunnelId: proxTunnel,
          title: "OBJECT DETECTED — TUNNEL-6",
          details: `HC-SR04 ultrasonic proximity sensor measured ${dist.toFixed(1)} cm in ${proxTunnel} (< 25 cm threshold). Route obstructed.`,
        });
      }
      lastProxActive = true;
    } else {
      lastProxActive = false;
    }

    if (hardwareAlerts.length > 50) {
      hardwareAlerts.pop();
    }

    console.log(`[API] Sensor event saved successfully`);

    res.json({
      success: true,
      remoteBuzzerCommand,
      message: "Telemetry logged successfully",
      mappings: {
        flame: flameTunnel,
        gas: gasTunnel,
        ultrasonic: proxTunnel,
      },
    });
  } catch (error) {
    console.error(`[ERROR] Sensor data parsing failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hardware/telemetry
router.get("/telemetry", (req, res) => {
  const isStale =
    Date.now() - new Date(latestHardwareTelemetry.lastUpdated).getTime() >= 12000;
  const isLive = !isStale && latestHardwareTelemetry.connected;

  res.json({
    latest: {
      ...latestHardwareTelemetry,
      flameDetected: isLive ? latestHardwareTelemetry.flameDetected : false,
      gasPpm: isLive ? latestHardwareTelemetry.gasPpm : 60,
      gasLevel: isLive ? latestHardwareTelemetry.gasLevel : "OFFLINE",
      distanceCm: isLive ? latestHardwareTelemetry.distanceCm : 150.0,
      proximityAlert: isLive ? latestHardwareTelemetry.proximityAlert : false,
      buzzerActive: isLive ? latestHardwareTelemetry.buzzerActive : false,
      status: isLive ? latestHardwareTelemetry.status : "OFFLINE",
      connectionStatus: isLive ? "ONLINE" : "OFFLINE",
      connected: isLive,
      isLive,
    },
    history: hardwareTelemetryHistory,
    remoteBuzzerCommand,
  });
});

// POST /api/hardware/reset
router.post("/reset", (req, res) => {
  latestHardwareTelemetry = {
    deviceId: "ESP32-MINE-NODE-01",
    flameDetected: false,
    gasPpm: 60,
    gasLevel: "NORMAL",
    distanceCm: 150.0,
    proximityAlert: false,
    buzzerActive: false,
    status: "NORMAL",
    connected: false,
    lastUpdated: new Date().toISOString(),
  };
  hardwareTelemetryHistory.length = 0;
  hardwareAlerts.length = 0;
  remoteBuzzerCommand = false;
  if (edgeService.clearAllPhysicalHazards) {
    edgeService.clearAllPhysicalHazards();
  } else {
    edgeService.resetSimulation();
  }
  res.json({ success: true, message: "Hardware telemetry reset to clean safe state." });
});

// POST /api/hardware/buzzer
router.post("/buzzer", (req, res) => {
  const { action } = req.body;
  if (action === "TEST" || action === "ON") {
    remoteBuzzerCommand = true;
  } else {
    remoteBuzzerCommand = false;
  }
  res.json({ success: true, remoteBuzzerCommand });
});

// GET /api/hardware/alerts
router.get("/alerts", (req, res) => {
  res.json(hardwareAlerts);
});

module.exports = router;

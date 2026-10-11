/**
 * MINEGUARD PHYSICAL SENSOR DATA FLOW & PIPELINE TEST SUITE
 * Tests Section 7 requirements:
 * 1. Flame Sensor -> TUNNEL-2
 * 2. Gas Sensor -> TUNNEL-10
 * 3. Ultrasonic Sensor -> TUNNEL-6
 * 4. Recovery & Historical Preservation
 * 5. Disconnection / Offline Handling (No False Normal)
 * 6. Duplicate Alert Suppression
 */

const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const { EdgeIntelligenceService } = require("../services/edgeIntelligence");
const { DEFAULT_MINE_TOPOLOGY } = require("../config/mineTopology");

describe("MineGuard Physical Sensor Pipeline Verification", () => {
  let edgeService;

  beforeEach(() => {
    edgeService = new EdgeIntelligenceService(DEFAULT_MINE_TOPOLOGY);
  });

  test("Scenario 1: Flame sensor detects fire -> Fire alert appears and Tunnel 2 is highlighted", () => {
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: true,
      gasPpm: 65,
      distanceCm: 150.0,
      timestamp: new Date().toISOString(),
    });

    // Tunnel 2 must be hazardous and flagged with fire
    const t2 = edgeService.routeEngine.edges.get("T2");
    assert.equal(t2.status, "HAZARDOUS");
    assert.equal(t2.hazardType, "FIRE");
    assert.equal(t2.flameDetected, true);

    // Tunnel 10 and Tunnel 6 must remain safe
    const t10 = edgeService.routeEngine.edges.get("T10");
    const t6 = edgeService.routeEngine.edges.get("T6");
    assert.equal(t10.status, "SAFE");
    assert.equal(t6.status, "SAFE");

    // Emergency alert list must include TUNNEL T2 Fire
    assert.ok(
      edgeService.emergencyAlerts.some((a) => a.title.includes("FIRE") && (a.tunnelId === "T2" || a.tunnelId === "TUNNEL-2")),
      "Alert must appear for Tunnel T2"
    );
  });

  test("Scenario 2: Flame sensor returns to normal -> Tunnel 2 updates without deleting historical events", () => {
    // 1. Trigger flame
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: true,
      gasPpm: 65,
      distanceCm: 150.0,
      timestamp: new Date().toISOString(),
    });

    const fireAlertsCount = edgeService.emergencyAlerts.length;
    assert.ok(fireAlertsCount > 0, "Initial fire alert must exist");

    // Fast-forward cooldown
    edgeService.physicalSensors.flame.lastSeen = Date.now() - 16000;

    // 2. Clear flame
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: false,
      gasPpm: 65,
      distanceCm: 150.0,
      timestamp: new Date().toISOString(),
    });

    const t2 = edgeService.routeEngine.edges.get("T2");
    assert.equal(t2.status, "SAFE", "Tunnel 2 must return to SAFE status");
    assert.equal(t2.hazardType, null);

    // Verify historical events are preserved and NOT deleted
    const fullStatus = edgeService.getEdgeStatus();
    assert.ok(fullStatus.emergencyAlerts.length >= fireAlertsCount, "Historical alerts must NOT be deleted upon returning to normal");
  });

  test("Scenario 3: Gas reading crosses danger threshold (>=320 PPM) -> Gas alert appears and Tunnel 10 is highlighted", () => {
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: false,
      gasPpm: 420,
      distanceCm: 150.0,
      timestamp: new Date().toISOString(),
    });

    // Tunnel 10 must be hazardous
    const t10 = edgeService.routeEngine.edges.get("T10");
    assert.equal(t10.status, "HAZARDOUS");
    assert.equal(t10.hazardType, "TOXIC_GAS");
    assert.equal(t10.gasPpm, 420);

    // Tunnel 2 and Tunnel 6 must remain safe
    const t2 = edgeService.routeEngine.edges.get("T2");
    const t6 = edgeService.routeEngine.edges.get("T6");
    assert.equal(t2.status, "SAFE");
    assert.equal(t6.status, "SAFE");

    // Emergency alert list must include TUNNEL T10 Gas
    assert.ok(
      edgeService.emergencyAlerts.some((a) => a.title.includes("GAS") && (a.tunnelId === "T10" || a.tunnelId === "TUNNEL-10")),
      "Alert must appear for Tunnel T10"
    );
  });

  test("Scenario 4: Gas reading returns below recovery threshold (<180 PPM) -> Tunnel 10 updates correctly", () => {
    // 1. Gas spike
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: false,
      gasPpm: 450,
      distanceCm: 150.0,
      timestamp: new Date().toISOString(),
    });

    // Fast-forward cooldown
    edgeService.physicalSensors.gas.lastSeen = Date.now() - 11000;

    // 2. Gas drops below 180 PPM
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: false,
      gasPpm: 95,
      distanceCm: 150.0,
      timestamp: new Date().toISOString(),
    });

    const t10 = edgeService.routeEngine.edges.get("T10");
    assert.equal(t10.status, "SAFE", "Tunnel 10 must return to SAFE status");
    assert.equal(t10.hazardType, null);
  });

  test("Scenario 5: Ultrasonic sensor detects object within configured distance (<25 cm) -> Object alert appears and Tunnel 6 is highlighted", () => {
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: false,
      gasPpm: 60,
      distanceCm: 14.5,
      timestamp: new Date().toISOString(),
    });

    // Tunnel 6 must be blocked
    const t6 = edgeService.routeEngine.edges.get("T6");
    assert.equal(t6.status, "BLOCKED");
    assert.equal(t6.hazardType, "OBSTRUCTION");
    assert.equal(t6.distanceCm, 14.5);

    // Tunnel 2 and Tunnel 10 must remain safe
    const t2 = edgeService.routeEngine.edges.get("T2");
    const t10 = edgeService.routeEngine.edges.get("T10");
    assert.equal(t2.status, "SAFE");
    assert.equal(t10.status, "SAFE");

    // Emergency alert list must include TUNNEL T6 Obstacle
    assert.ok(
      edgeService.emergencyAlerts.some((a) => a.title.includes("OBSTACLE") && (a.tunnelId === "T6" || a.tunnelId === "TUNNEL-6")),
      "Alert must appear for Tunnel T6"
    );
  });

  test("Scenario 6: Sensor becomes disconnected -> Status shows OFFLINE, never false NORMAL", () => {
    // Ingest telemetry
    edgeService.processTelemetry({
      deviceId: "ESP32-CORE-EDGE-GATEWAY",
      flameDetected: false,
      gasPpm: 60,
      distanceCm: 150.0,
      timestamp: new Date().toISOString(),
    });

    // Simulate sensor disconnect by aging the snapshot past staleTimeoutMs (>12s)
    edgeService.latestPhysicalTelemetry.timestamp = new Date(Date.now() - 20000).toISOString();
    for (const sensor of edgeService.sensorNodes.values()) {
      sensor.lastReadingTime = Date.now() - 20000;
    }

    edgeService.checkStaleSensors();
    assert.equal(edgeService.latestPhysicalTelemetry.isStale, true, "Sensors older than 12s must be flagged as stale");

    const edgeStatus = edgeService.getEdgeStatus();
    assert.equal(edgeStatus.latestPhysicalTelemetry.status, "OFFLINE", "Disconnected telemetry must be OFFLINE, never false NORMAL");
  });

  test("Scenario 7: Continuous hazard readings do NOT generate unlimited duplicate alerts", () => {
    // Ingest 10 consecutive readings with active flame
    for (let i = 0; i < 10; i++) {
      edgeService.processTelemetry({
        deviceId: "ESP32-CORE-EDGE-GATEWAY",
        flameDetected: true,
        gasPpm: 60,
        distanceCm: 150.0,
        timestamp: new Date().toISOString(),
      });
    }

    // Filter alerts for T2 Fire
    const t2Alerts = edgeService.emergencyAlerts.filter(
      (a) => a.title.includes("FIRE") && (a.tunnelId === "T2" || a.tunnelId === "TUNNEL-2")
    );
    assert.equal(t2Alerts.length, 1, "Continuous fire must only trigger 1 alert, not 10 duplicate alerts");
  });
});

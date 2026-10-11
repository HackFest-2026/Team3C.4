/**
 * MINEGUARD SAFE EVACUATION ROUTE ENGINE & EDGE INTELLIGENCE TEST SUITE
 * Uses Node.js native test runner (node:test & node:assert)
 */

const { test, describe, before, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const RouteEngine = require("../services/routeEngine");
const { EdgeIntelligenceService } = require("../services/edgeIntelligence");
const { DEFAULT_MINE_TOPOLOGY } = require("../config/mineTopology");

describe("MineGuard Safe Evacuation Route Engine Tests", () => {
  let engine;

  beforeEach(() => {
    engine = new RouteEngine(DEFAULT_MINE_TOPOLOGY);
  });

  test("1. Normal Operation: Calculates shortest verified safe route to surface exit", () => {
    // Worker at WORK_FACE_A
    // Clean routes available:
    // Path A: WORK_FACE_A -> T1 (120m) -> J1 -> T3 (140m) -> EXIT_BRAVO (Total 260m)
    // Path B: WORK_FACE_A -> T1 (120m) -> J1 -> T2 (95m) -> SHAFT_MAIN -> T5 (85m) -> EXIT_CHARLIE (Total 300m)
    const result = engine.findSafestRoute("WORK_FACE_A");

    assert.equal(result.success, true);
    assert.equal(result.routeStatus, "VERIFIED SAFE");
    assert.equal(result.targetExitId, "EXIT_BRAVO");
    assert.equal(result.totalDistanceMeters, 260);
    assert.deepEqual(result.pathEdges, ["T1", "T3"]);
    assert.deepEqual(result.pathNodes, ["WORK_FACE_A", "JUNCTION_J1", "EXIT_BRAVO"]);
    assert.equal(result.instructions.length, 2);
    assert.equal(result.unverifiedSegments.length, 0);
  });

  test("2. Fire Hazard in T3: Circumvents fire and dynamically routes to alternative exit", () => {
    // Inject fire in Tunnel T3
    engine.updateTunnelStatus("T3", {
      status: "HAZARDOUS",
      hazardType: "FIRE",
      flameDetected: true,
    });

    const result = engine.findSafestRoute("WORK_FACE_A");

    assert.equal(result.success, true);
    assert.equal(result.routeStatus, "VERIFIED SAFE");
    // Next best exit should be EXIT_CHARLIE via SHAFT_MAIN (120 + 95 + 85 = 300m)
    assert.equal(result.targetExitId, "EXIT_CHARLIE");
    assert.ok(!result.pathEdges.includes("T3"), "Route must NEVER include fire-compromised tunnel T3");
    assert.deepEqual(result.pathEdges, ["T1", "T2", "T5"]);
  });

  test("3. Gas Hazard in T1: Avoids high toxic gas (>320 PPM) via Lower Bypass Ramp", () => {
    // Inject critical gas spike in Tunnel T1 (e.g. 450 PPM)
    engine.updateTunnelStatus("T1", {
      status: "HAZARDOUS",
      hazardType: "TOXIC_GAS",
      gasPpm: 450,
    });

    const result = engine.findSafestRoute("WORK_FACE_A");

    assert.equal(result.success, true);
    assert.ok(!result.pathEdges.includes("T1"), "Route must NEVER traverse hazardous gas tunnel T1");
    // Should take alternative egress via T4 (Lower Bypass) -> J3 -> T9 -> J2 -> T7 -> EXIT_ALPHA
    assert.equal(result.pathEdges[0], "T4");
    assert.equal(result.targetExitId, "EXIT_ALPHA");
  });

  test("4. Obstruction in Tunnel T3: Circumvents rockfall (<25 cm clearance)", () => {
    engine.updateTunnelStatus("T3", {
      status: "BLOCKED",
      hazardType: "OBSTRUCTION",
      distanceCm: 18.0,
    });

    const result = engine.findSafestRoute("WORK_FACE_A");

    assert.equal(result.success, true);
    assert.ok(!result.pathEdges.includes("T3"), "Route must NEVER send worker into blocked tunnel");
    assert.notEqual(result.targetExitId, "EXIT_BRAVO");
  });

  test("5. Sensor Offline / Unknown Tunnel: Applies fail-safe and marks route SAFETY UNVERIFIED", () => {
    // Disconnect sensor on Tunnel T3
    engine.updateTunnelStatus("T3", {
      status: "UNKNOWN",
      sensorActive: false,
    });

    // Block T2 so worker is forced to take T3 if they want to exit
    engine.updateTunnelStatus("T2", {
      status: "BLOCKED",
      hazardType: "OBSTRUCTION",
    });
    // Also block T4
    engine.updateTunnelStatus("T4", {
      status: "BLOCKED",
    });

    const result = engine.findSafestRoute("WORK_FACE_A");

    assert.equal(result.success, true);
    // Route must be flagged as SAFETY UNVERIFIED due to unmonitored segment T3
    assert.equal(result.routeStatus, "SAFETY UNVERIFIED");
    assert.ok(result.unverifiedSegments.includes("T3"));
    assert.match(result.reason, /offline or unmonitored sensors/);
  });

  test("6. No Verified Safe Route: When all exits are cut off, directs to Refuge Chamber", () => {
    // Block both T1 and T4 (all exits from Face A)
    engine.updateTunnelStatus("T1", {
      status: "HAZARDOUS",
      hazardType: "FIRE",
    });
    engine.updateTunnelStatus("T4", {
      status: "BLOCKED",
      hazardType: "OBSTRUCTION",
    });

    const result = engine.findSafestRoute("WORK_FACE_A");

    assert.equal(result.success, false);
    assert.equal(result.routeStatus, "NO VERIFIED SAFE ROUTE");
    assert.equal(result.pathEdges.length, 0);
    assert.match(result.nextAction, /TAKE SHELTER/);
  });

  test("7. Disconnected / Trapped in Dead End: Handles graph disconnection without crashing", () => {
    // Create an isolated island node
    const isolatedEngine = new RouteEngine({
      nodes: [
        { id: "NODE_ISOLATED", name: "Trapped Pocket", isExit: false },
        { id: "EXIT_SURFACE", name: "Surface Exit", isExit: true },
      ],
      edges: [],
    });

    const result = isolatedEngine.findSafestRoute("NODE_ISOLATED");
    assert.equal(result.success, false);
    assert.equal(result.routeStatus, "NO VERIFIED SAFE ROUTE");
  });

  test("8. Dynamic Rerouting Detection: Identifies route alterations correctly", () => {
    const route1 = engine.findSafestRoute("WORK_FACE_A");
    assert.equal(route1.targetExitId, "EXIT_BRAVO");

    // Block T3
    engine.updateTunnelStatus("T3", { status: "HAZARDOUS", hazardType: "FIRE" });
    const route2 = engine.findSafestRoute("WORK_FACE_A");

    const changed = engine.hasRouteChanged(route1, route2);
    assert.equal(changed, true);
    assert.notEqual(route1.targetExitId, route2.targetExitId);
  });
});

describe("MineGuard Edge Intelligence Module Tests", () => {
  let edgeService;

  beforeEach(() => {
    edgeService = new EdgeIntelligenceService(DEFAULT_MINE_TOPOLOGY);
  });

  test("9. Telemetry Ingestion: Deterministically triggers fire alarm and updates tunnel", () => {
    const telemetry = {
      deviceId: "ESP32-MINE-NODE-01",
      flameDetected: true,
      gasPpm: 120,
      distanceCm: 150,
      isSimulated: false,
      workerId: "W-104",
    };

    const res = edgeService.processTelemetry(telemetry);

    assert.equal(res.success, true);
    assert.equal(res.tunnelStatus, "HAZARDOUS");
    assert.equal(res.hazardType, "FIRE");
    assert.equal(res.helmetCommand.buzzerAlert, true);
    assert.equal(res.isSimulated, false);
  });

  test("10. Simulation Scenarios: Scenario B (Fire) and Scenario F (No Safe Route)", () => {
    // Apply Scenario B
    const resB = edgeService.applyScenario("B");
    assert.equal(resB.scenario, "B_FIRE_T2");
    assert.equal(edgeService.isSimulatedMode, true);

    const workerRouteB = edgeService.getWorkerRoute("W-104");
    assert.ok(!workerRouteB.pathEdges.includes("T2"));

    // Apply Scenario F
    const resF = edgeService.applyScenario("F");
    assert.equal(resF.scenario, "F_NO_SAFE_ROUTE");
    const workerRouteF = edgeService.getWorkerRoute("W-104");
    assert.equal(workerRouteF.routeStatus, "NO VERIFIED SAFE ROUTE");
  });

  test("11. SOS Distress Beacon: Triggers and acknowledges emergency beacon", () => {
    const triggered = edgeService.triggerSOS("W-104", "Simulated panic button pressed");
    assert.equal(triggered, true);

    const worker = edgeService.workers.get("W-104");
    assert.equal(worker.sosActive, true);

    const ack = edgeService.acknowledgeSOS("W-104");
    assert.equal(ack, true);
    assert.equal(worker.sosActive, false);
  });

  test("12. Multi-Hazard Simultaneous Ingestion: Concurrently triggers T2 Fire, T10 Gas, and T6 Obstacle", () => {
    // Single ESP32 telemetry packet reporting hazards across all 3 sensors
    const multiTelemetry = {
      deviceId: "ESP32-MINE-NODE-01",
      flameDetected: true,
      gasPpm: 450, // >= 320 PPM critical
      distanceCm: 15.0, // < 25 cm obstruction
      isSimulated: false,
    };

    const res = edgeService.processTelemetry(multiTelemetry);
    assert.equal(res.success, true);

    // Verify all 3 sensors are independently active
    assert.equal(edgeService.physicalSensors.flame.active, true);
    assert.equal(edgeService.physicalSensors.gas.active, true);
    assert.equal(edgeService.physicalSensors.obstacle.active, true);

    // Verify all 3 corresponding tunnels updated in the graph
    const edgeT2 = edgeService.routeEngine.edges.get("T2");
    const edgeT10 = edgeService.routeEngine.edges.get("T10");
    const edgeT6 = edgeService.routeEngine.edges.get("T6");

    assert.equal(edgeT2.status, "HAZARDOUS");
    assert.equal(edgeT2.hazardType, "FIRE");

    assert.equal(edgeT10.status, "HAZARDOUS");
    assert.equal(edgeT10.hazardType, "TOXIC_GAS");

    assert.equal(edgeT6.status, "BLOCKED");
    assert.equal(edgeT6.hazardType, "OBSTRUCTION");
  });

  test("13. Independent Cooldown Recovery: Updating one sensor does NOT clear other active hazards", () => {
    // 1. Trigger flame on T2 and obstacle on T6
    edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      flameDetected: true,
      gasPpm: 60,
      distanceCm: 12.0,
      isSimulated: false,
    });

    assert.equal(edgeService.physicalSensors.flame.active, true);
    assert.equal(edgeService.physicalSensors.obstacle.active, true);

    // 2. Next packet: flame drops to false, distance returns to normal (150cm)
    // Both sensors enter their independent cooldown windows and MUST REMAIN ACTIVE!
    edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      flameDetected: false,
      gasPpm: 60,
      distanceCm: 150.0,
      isSimulated: false,
    });

    // Verification cooling window is 15s for flame, 10s for obstacle
    assert.equal(edgeService.physicalSensors.flame.active, true);
    assert.equal(edgeService.physicalSensors.obstacle.active, true);

    // Verify T2 is still HAZARDOUS and T6 is still BLOCKED
    assert.equal(edgeService.routeEngine.edges.get("T2").status, "HAZARDOUS");
    assert.equal(edgeService.routeEngine.edges.get("T6").status, "BLOCKED");
  });

  test("14. Simulation Reset Preservation: Resetting manual simulation preserves active physical hazards", () => {
    // 1. Hardware detects fire on T2
    edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      flameDetected: true,
      gasPpm: 60,
      distanceCm: 150.0,
      isSimulated: false,
    });

    assert.equal(edgeService.physicalSensors.flame.active, true);

    // 2. User resets simulation in UI / API
    edgeService.resetSimulation();

    // Active physical fire on T2 MUST be preserved!
    assert.equal(edgeService.routeEngine.edges.get("T2").status, "HAZARDOUS");
    assert.equal(edgeService.routeEngine.edges.get("T2").hazardType, "FIRE");
  });

  test("15. Test A — Tunnel T2 Fire: Triggers dangerous status, FIRE DETECTED — TUNNEL T2 alert, and avoids T2", () => {
    edgeService.clearAllPhysicalHazards();
    const res = edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      tunnelId: "T2",
      flameDetected: true,
      gasPpm: 60,
      distanceCm: 150.0,
      isSimulated: false,
    });

    assert.equal(edgeService.routeEngine.edges.get("T2").status, "HAZARDOUS");
    assert.equal(edgeService.routeEngine.edges.get("T2").hazardType, "FIRE");
    assert.equal(edgeService.emergencyAlerts[0].title, "FIRE DETECTED — TUNNEL T2");

    const route = edgeService.getWorkerRoute("W-104");
    assert.ok(!route.pathEdges.includes("T2"), "Route must avoid Tunnel T2 during fire");
  });

  test("16. Test B — Tunnel T2 Gas: Triggers dangerous status, DANGEROUS GAS DETECTED — TUNNEL T2 alert, and avoids T2", () => {
    edgeService.clearAllPhysicalHazards();
    const res = edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      tunnelId: "T2",
      flameDetected: false,
      gasPpm: 450, // >= 320 PPM
      distanceCm: 150.0,
      isSimulated: false,
    });

    assert.equal(edgeService.routeEngine.edges.get("T2").status, "HAZARDOUS");
    assert.equal(edgeService.routeEngine.edges.get("T2").hazardType, "TOXIC_GAS");
    assert.equal(edgeService.emergencyAlerts[0].title, "DANGEROUS GAS DETECTED — TUNNEL T2");

    const route = edgeService.getWorkerRoute("W-104");
    assert.ok(!route.pathEdges.includes("T2"), "Route must avoid Tunnel T2 during critical gas");
  });

  test("17. Test C — Tunnel T10 Gas: Triggers dangerous status, DANGEROUS GAS DETECTED — TUNNEL T10 alert, and avoids T10", () => {
    edgeService.clearAllPhysicalHazards();
    const res = edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      tunnelId: "T10",
      flameDetected: false,
      gasPpm: 480, // >= 320 PPM
      distanceCm: 150.0,
      isSimulated: false,
    });

    assert.equal(edgeService.routeEngine.edges.get("T10").status, "HAZARDOUS");
    assert.equal(edgeService.routeEngine.edges.get("T10").hazardType, "TOXIC_GAS");
    assert.equal(edgeService.emergencyAlerts[0].title, "DANGEROUS GAS DETECTED — TUNNEL T10");

    const route = edgeService.routeEngine.findSafestRoute("JUNCTION_J3");
    assert.ok(!route.pathEdges.includes("T10"), "Route must avoid Tunnel T10 during toxic gas");
  });

  test("18. Test D — Tunnel T6 Obstacle: Triggers blocked status, OBSTACLE DETECTED — TUNNEL T6 alert, normal dist does not alarm", () => {
    edgeService.clearAllPhysicalHazards();
    // 1. Obstacle < 25 cm
    const resBlocked = edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      tunnelId: "T6",
      flameDetected: false,
      gasPpm: 60,
      distanceCm: 14.0, // < 25 cm
      isSimulated: false,
    });

    assert.equal(edgeService.routeEngine.edges.get("T6").status, "BLOCKED");
    assert.equal(edgeService.routeEngine.edges.get("T6").hazardType, "OBSTRUCTION");
    assert.equal(edgeService.emergencyAlerts[0].title, "OBSTACLE DETECTED — TUNNEL T6");

    const route = edgeService.routeEngine.findSafestRoute("SHAFT_MAIN");
    assert.ok(!route.pathEdges.includes("T6"), "Route must avoid blocked tunnel T6");

    // 2. Clear clearance (150 cm) does not cause emergency alarm
    edgeService.clearAllPhysicalHazards();
    const resNormal = edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      tunnelId: "T6",
      flameDetected: false,
      gasPpm: 60,
      distanceCm: 150.0,
      isSimulated: false,
    });
    assert.equal(edgeService.routeEngine.edges.get("T6").status, "SAFE");
    assert.equal(edgeService.emergencyAlerts.length, 0);
  });

  test("19. Test E — Multiple Simultaneous Hazards: Avoids all active hazards across multiple tunnels", () => {
    edgeService.clearAllPhysicalHazards();
    // Flame on T2 and Obstacle on T6 simultaneously
    edgeService.processTelemetry({
      deviceId: "ESP32-MINE-NODE-01",
      flameDetected: true,
      gasPpm: 60,
      distanceCm: 12.0,
      isSimulated: false,
    });

    assert.equal(edgeService.routeEngine.edges.get("T2").status, "HAZARDOUS");
    assert.equal(edgeService.routeEngine.edges.get("T6").status, "BLOCKED");

    const route = edgeService.getWorkerRoute("W-104");
    assert.ok(!route.pathEdges.includes("T2"));
    assert.ok(!route.pathEdges.includes("T6"));
  });

  test("20. Test F — No Safe Exit: Displays no safe route warning and never traverses hazardous tunnel", () => {
    edgeService.clearAllPhysicalHazards();
    // Block both escape paths from WORK_FACE_A (T1 and T4)
    edgeService.routeEngine.updateTunnelStatus("T1", { status: "HAZARDOUS", hazardType: "FIRE" });
    edgeService.routeEngine.updateTunnelStatus("T4", { status: "BLOCKED", hazardType: "OBSTRUCTION" });

    const route = edgeService.routeEngine.findSafestRoute("WORK_FACE_A");
    assert.equal(route.success, false);
    assert.ok(route.routeStatus.includes("NO VERIFIED SAFE ROUTE") || route.routeStatus.includes("NO SAFE ROUTE"));
    assert.deepEqual(route.pathEdges, [], "Must never route through hazardous tunnels");
  });

  test("21. Test G — Recovery: Restores tunnels to safe baseline after clearing", () => {
    edgeService.clearAllPhysicalHazards();
    assert.equal(edgeService.routeEngine.edges.get("T2").status, "SAFE");
    assert.equal(edgeService.routeEngine.edges.get("T10").status, "SAFE");
    assert.equal(edgeService.routeEngine.edges.get("T6").status, "SAFE");

    const route = edgeService.getWorkerRoute("W-104");
    assert.equal(route.routeStatus, "VERIFIED SAFE");
    assert.deepEqual(route.pathEdges, ["T1", "T3"]);
  });
});


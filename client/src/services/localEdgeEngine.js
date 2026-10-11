/**
 * MINEGUARD LOCAL ON-DEVICE EDGE COMPUTING ENGINE
 * 100% Autonomous In-Browser / Local Device Evacuation Route Optimizer
 *
 * Runs completely locally inside the edge device / web client memory.
 * Computes safest underground mine evacuation routes in < 1ms with ZERO
 * network transmission to cloud, WAN, or central control room.
 */

export const DEFAULT_MINE_TOPOLOGY = {
  id: "ACDS-GOLD-SECTOR-04",
  name: "ACDS Gold Mines — Deep Lode Section 4",
  description: "Subterranean gold reef extraction complex with multi-adit emergency egress",
  coordinateSystem: {
    unit: "meters",
    viewBox: { width: 1000, height: 600 },
  },
  nodes: [
    {
      id: "EXIT_ALPHA",
      name: "Surface Portal Alpha",
      type: "EXIT",
      isExit: true,
      x: 820,
      y: 110,
      zone: "East Surface Adit",
      elevation: 0,
      description: "Primary heavy vehicle haulage portal to surface yard",
    },
    {
      id: "EXIT_BRAVO",
      name: "Ventilation Adit Beta",
      type: "EXIT",
      isExit: true,
      x: 180,
      y: 130,
      zone: "West Exhaust Drift",
      elevation: -15,
      description: "West emergency personnel egress with fresh air intake",
    },
    {
      id: "EXIT_CHARLIE",
      name: "Escape Shaft Charlie",
      type: "EXIT",
      isExit: true,
      x: 500,
      y: 50,
      zone: "Central Headframe",
      elevation: 0,
      description: "Vertical hoist escape shaft with auxiliary cage & ladderway",
    },
    {
      id: "SHAFT_MAIN",
      name: "Main Central Shaft Station",
      type: "SHAFT",
      isExit: false,
      x: 500,
      y: 180,
      zone: "Shaft Bottom",
      elevation: -180,
      description: "Central hoisting transfer station and substation",
    },
    {
      id: "JUNCTION_J1",
      name: "Junction J1 (West Crosscut)",
      type: "JUNCTION",
      isExit: false,
      x: 350,
      y: 280,
      zone: "Level 1 West Drift",
      elevation: -210,
      description: "Crosscut intersection between Face Alpha and West Adit",
    },
    {
      id: "JUNCTION_J2",
      name: "Junction J2 (East Crosscut)",
      type: "JUNCTION",
      isExit: false,
      x: 650,
      y: 280,
      zone: "Level 1 East Drift",
      elevation: -210,
      description: "Crosscut intersection between Face Beta and East Portal",
    },
    {
      id: "JUNCTION_J3",
      name: "Junction J3 (Lower Stope Substation)",
      type: "JUNCTION",
      isExit: false,
      x: 500,
      y: 400,
      zone: "Level 2 Sub-Haulage",
      elevation: -290,
      description: "Lower ramp interchange connecting refuge chamber and deep stopes",
    },
    {
      id: "WORK_FACE_A",
      name: "Extraction Face Alpha (Deep Lode)",
      type: "WORK_FACE",
      isExit: false,
      x: 220,
      y: 480,
      zone: "Gold Pit Stope 4A",
      elevation: -320,
      description: "Active high-grade gold reef drilling and mucking zone",
    },
    {
      id: "WORK_FACE_B",
      name: "Production Face Beta (Vein 7)",
      type: "WORK_FACE",
      isExit: false,
      x: 780,
      y: 480,
      zone: "Gold Vein 7 South",
      elevation: -310,
      description: "Blasting and mechanized haulage development face",
    },
    {
      id: "REFUGE_BAY_1",
      name: "Pressurized Refuge Chamber #1",
      type: "REFUGE",
      isRefuge: true,
      isExit: false,
      x: 500,
      y: 540,
      zone: "Emergency Safe Haven",
      elevation: -295,
      description: "Airtight refuge shelter with 96hr oxygen bank and DGMS communications",
    },
  ],
  edges: [
    {
      id: "T1",
      name: "Tunnel T1 (Face Alpha Ramp)",
      from: "WORK_FACE_A",
      to: "JUNCTION_J1",
      lengthMeters: 120,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 75,
      distanceCm: 140,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T2",
      name: "Tunnel T2 (Central Crosscut)",
      from: "JUNCTION_J1",
      to: "SHAFT_MAIN",
      lengthMeters: 95,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 60,
      distanceCm: 180,
      sensorNode: "ESP32-MINE-NODE-01",
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T3",
      name: "Tunnel T3 (West Adit Egress)",
      from: "JUNCTION_J1",
      to: "EXIT_BRAVO",
      lengthMeters: 140,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 50,
      distanceCm: 220,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T4",
      name: "Tunnel T4 (Lower Bypass Ramp)",
      from: "WORK_FACE_A",
      to: "JUNCTION_J3",
      lengthMeters: 160,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 90,
      distanceCm: 160,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T5",
      name: "Tunnel T5 (Shaft Escape Drift)",
      from: "SHAFT_MAIN",
      to: "EXIT_CHARLIE",
      lengthMeters: 85,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 45,
      distanceCm: 250,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T6",
      name: "Tunnel T6 (East Central Crosscut)",
      from: "SHAFT_MAIN",
      to: "JUNCTION_J2",
      lengthMeters: 95,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 55,
      distanceCm: 190,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T7",
      name: "Tunnel T7 (East Portal Haulageway)",
      from: "JUNCTION_J2",
      to: "EXIT_ALPHA",
      lengthMeters: 130,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 65,
      distanceCm: 240,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T8",
      name: "Tunnel T8 (Face Beta Incline)",
      from: "WORK_FACE_B",
      to: "JUNCTION_J2",
      lengthMeters: 110,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 80,
      distanceCm: 150,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T9",
      name: "Tunnel T9 (Substation Level Ramp)",
      from: "JUNCTION_J3",
      to: "JUNCTION_J2",
      lengthMeters: 150,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 70,
      distanceCm: 170,
      sensorActive: true,
      bidirectional: true,
    },
    {
      id: "T10",
      name: "Tunnel T10 (Refuge Spur)",
      from: "JUNCTION_J3",
      to: "REFUGE_BAY_1",
      lengthMeters: 45,
      status: "SAFE",
      hazardType: null,
      flameDetected: false,
      gasPpm: 35,
      distanceCm: 300,
      sensorActive: true,
      bidirectional: true,
    },
  ],
};

/**
 * On-Device Route Engine implementing Dijkstra with deterministic hazard exclusion
 */
export class LocalRouteEngine {
  constructor(topology = DEFAULT_MINE_TOPOLOGY) {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacency = new Map();
    this.loadTopology(topology);
  }

  loadTopology(topology) {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();

    topology.nodes.forEach((node) => {
      this.nodes.set(node.id, {
        id: node.id,
        name: node.name || node.id,
        type: node.type || "JUNCTION",
        isExit: Boolean(node.isExit || node.type === "EXIT"),
        isRefuge: Boolean(node.isRefuge || node.type === "REFUGE"),
        x: Number(node.x || 0),
        y: Number(node.y || 0),
        zone: node.zone || "Mine Section",
      });
      this.adjacency.set(node.id, []);
    });

    topology.edges.forEach((edge) => {
      const edgeRecord = {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        name: edge.name || `Tunnel ${edge.id}`,
        lengthMeters: Math.max(1, Number(edge.lengthMeters || 50)),
        status: edge.status || "SAFE",
        hazardType: edge.hazardType || null,
        flameDetected: Boolean(edge.flameDetected),
        gasPpm: Number(edge.gasPpm || 0),
        distanceCm: Number(edge.distanceCm || 100),
        sensorActive: edge.sensorActive !== undefined ? Boolean(edge.sensorActive) : true,
        bidirectional: edge.bidirectional !== false,
      };

      this.edges.set(edge.id, edgeRecord);

      if (this.adjacency.has(edge.from)) {
        this.adjacency.get(edge.from).push({ edgeId: edge.id, neighborId: edge.to });
      }
      if (edgeRecord.bidirectional && this.adjacency.has(edge.to)) {
        this.adjacency.get(edge.to).push({ edgeId: edge.id, neighborId: edge.from });
      }
    });
  }

  updateTunnelStatus(edgeId, update) {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;
    Object.assign(edge, update);
    return true;
  }

  getEdgeCost(edge) {
    // Strict Exclusion: Hazardous or Blocked tunnels cannot be traversed
    if (edge.status === "HAZARDOUS" || edge.status === "BLOCKED") return Infinity;
    if (edge.flameDetected) return Infinity;
    if (edge.gasPpm >= 320) return Infinity;
    if (edge.distanceCm < 25.0 && edge.distanceCm > 0) return Infinity;

    let cost = edge.lengthMeters;
    if (edge.status === "CAUTION" || (edge.gasPpm >= 180 && edge.gasPpm < 320)) {
      cost += 500;
    }
    if (edge.status === "UNKNOWN" || !edge.sensorActive) {
      cost += 250;
    }
    return cost;
  }

  /**
   * Find safest route from startNodeId to any surface exit or refuge bay
   */
  findSafestRoute(startNodeId, options = {}) {
    const startTime = performance.now();

    if (!this.nodes.has(startNodeId)) {
      return {
        success: false,
        routeStatus: "NO VERIFIED SAFE ROUTE",
        reason: `Starting node '${startNodeId}' is not found in mine map.`,
        pathNodes: [],
        pathEdges: [],
        totalDistanceMeters: 0,
        instructions: [],
        computationTimeMs: 0,
        isComputedLocally: true,
      };
    }

    const startNode = this.nodes.get(startNodeId);
    if (startNode.isExit) {
      return {
        success: true,
        routeStatus: "AT SAFE EXIT",
        reason: `Worker is already at surface exit: ${startNode.name}.`,
        targetExitId: startNode.id,
        targetExitName: startNode.name,
        pathNodes: [startNodeId],
        pathEdges: [],
        totalDistanceMeters: 0,
        nextAction: "EVACUATED TO SURFACE — REPORT TO MUSTER POINT",
        instructions: [{ step: 1, action: "You have reached surface exit muster station.", distance: 0 }],
        unverifiedSegments: [],
        computationTimeMs: (performance.now() - startTime).toFixed(2),
        isComputedLocally: true,
      };
    }

    // Filter exit nodes
    let exitNodes = Array.from(this.nodes.values()).filter((n) => n.isExit);
    if (options.preferredExitId && this.nodes.has(options.preferredExitId)) {
      exitNodes = [this.nodes.get(options.preferredExitId)];
    }

    // Dijkstra
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(this.nodes.keys());

    this.nodes.forEach((_, nodeId) => distances.set(nodeId, Infinity));
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const d = distances.get(nodeId);
        if (d < minDistance) {
          minDistance = d;
          current = nodeId;
        }
      }

      if (current === null || minDistance === Infinity) break;
      unvisited.delete(current);

      const neighbors = this.adjacency.get(current) || [];
      for (const { edgeId, neighborId } of neighbors) {
        if (!unvisited.has(neighborId)) continue;
        const edge = this.edges.get(edgeId);
        const weight = this.getEdgeCost(edge);
        if (weight === Infinity) continue;

        const alt = distances.get(current) + weight;
        if (alt < distances.get(neighborId)) {
          distances.set(neighborId, alt);
          previous.set(neighborId, { prevNodeId: current, edgeId });
        }
      }
    }

    // Find best reachable exit
    let bestExit = null;
    let lowestCost = Infinity;

    for (const exit of exitNodes) {
      const cost = distances.get(exit.id);
      if (cost < lowestCost) {
        lowestCost = cost;
        bestExit = exit;
      }
    }

    // Fallback to refuge if all surface exits unreachable
    if (!bestExit || lowestCost === Infinity) {
      const refugeNodes = Array.from(this.nodes.values()).filter((n) => n.isRefuge);
      let bestRefuge = null;
      let minRefugeCost = Infinity;

      for (const refuge of refugeNodes) {
        const cost = distances.get(refuge.id);
        if (cost < minRefugeCost) {
          minRefugeCost = cost;
          bestRefuge = refuge;
        }
      }

      if (bestRefuge && minRefugeCost < Infinity) {
        const refugePath = this.reconstructPath(startNodeId, bestRefuge.id, previous);
        return {
          success: false,
          routeStatus: "NO VERIFIED SAFE ROUTE TO SURFACE",
          secondaryProtocol: "SEEK DESIGNATED REFUGE CHAMBER",
          reason: `All surface portals are blocked or hazardous. Immediate fallback routed locally to ${bestRefuge.name}.`,
          targetExitId: null,
          refugeId: bestRefuge.id,
          refugeName: bestRefuge.name,
          pathNodes: refugePath.nodes,
          pathEdges: refugePath.edges,
          totalDistanceMeters: refugePath.physicalDistance,
          nextAction: `PROCEED IMMEDIATELY TO REFUGE CHAMBER [${bestRefuge.name}]`,
          instructions: refugePath.instructions,
          unverifiedSegments: refugePath.unverifiedSegments,
          computationTimeMs: (performance.now() - startTime).toFixed(2),
          isComputedLocally: true,
        };
      }

      return {
        success: false,
        routeStatus: "NO VERIFIED SAFE ROUTE",
        reason: "All escape tunnels compromised. No passable route to any surface exit or refuge chamber exists.",
        pathNodes: [startNodeId],
        pathEdges: [],
        totalDistanceMeters: 0,
        nextAction: "TAKE SHELTER IMMEDIATELY — SOUND PERSONAL SOS BEACON",
        instructions: [
          {
            step: 1,
            action: "EMERGENCY: All escape tunnels compromised. Halt movement, engage self-rescuer respirator, and activate SOS beacon.",
            distance: 0,
          },
        ],
        unverifiedSegments: [],
        computationTimeMs: (performance.now() - startTime).toFixed(2),
        isComputedLocally: true,
      };
    }

    const pathResult = this.reconstructPath(startNodeId, bestExit.id, previous);
    const hasUnverified = pathResult.unverifiedSegments.length > 0;
    const routeStatus = hasUnverified ? "SAFETY UNVERIFIED" : "VERIFIED SAFE";

    let reasonMsg = `Verified safe path to ${bestExit.name} (${pathResult.physicalDistance}m) avoiding all identified hazard zones.`;
    if (hasUnverified) {
      reasonMsg = `Route established to ${bestExit.name} (${pathResult.physicalDistance}m), but segments [${pathResult.unverifiedSegments.join(
        ", "
      )}] have offline or unmonitored sensors.`;
    }

    return {
      success: true,
      routeStatus,
      reason: reasonMsg,
      targetExitId: bestExit.id,
      targetExitName: bestExit.name,
      pathNodes: pathResult.nodes,
      pathEdges: pathResult.edges,
      totalDistanceMeters: pathResult.physicalDistance,
      nextAction: pathResult.instructions[0]?.action || `PROCEED TOWARDS ${bestExit.name}`,
      instructions: pathResult.instructions,
      unverifiedSegments: pathResult.unverifiedSegments,
      computationTimeMs: (performance.now() - startTime).toFixed(2),
      isComputedLocally: true,
    };
  }

  reconstructPath(startNodeId, endNodeId, previous) {
    const nodes = [];
    const edges = [];
    let curr = endNodeId;

    while (curr !== startNodeId) {
      nodes.unshift(curr);
      const prevInfo = previous.get(curr);
      if (!prevInfo) break;
      edges.unshift(prevInfo.edgeId);
      curr = prevInfo.prevNodeId;
    }
    nodes.unshift(startNodeId);

    let physicalDistance = 0;
    const unverifiedSegments = [];
    const instructions = [];

    edges.forEach((edgeId, index) => {
      const edge = this.edges.get(edgeId);
      const fromNode = this.nodes.get(nodes[index]);
      const toNode = this.nodes.get(nodes[index + 1]);

      physicalDistance += edge.lengthMeters;
      if (edge.status === "UNKNOWN" || !edge.sensorActive) {
        unverifiedSegments.push(edge.id);
      }

      let directionVerb = index === 0 ? "HEAD TOWARDS" : "CONTINUE THROUGH";
      if (toNode.isExit) directionVerb = "EVACUATE OUT VIA";

      instructions.push({
        step: index + 1,
        tunnelId: edge.id,
        action: `${directionVerb} ${edge.name} to ${toNode.name} (${edge.lengthMeters}m)`,
        distance: edge.lengthMeters,
        fromNode: fromNode.name,
        toNode: toNode.name,
        status: edge.status,
      });
    });

    return {
      nodes,
      edges,
      physicalDistance,
      unverifiedSegments,
      instructions,
    };
  }

  /**
   * Evaluate all alternate paths from a worker node to all exits
   * for visual route comparison and explainability
   */
  evaluateAllPotentialRoutes(startNodeId) {
    const exits = Array.from(this.nodes.values()).filter((n) => n.isExit);
    const candidateRoutes = [];

    exits.forEach((exit) => {
      const res = this.findSafestRoute(startNodeId, { preferredExitId: exit.id });
      candidateRoutes.push({
        exitId: exit.id,
        exitName: exit.name,
        status: res.routeStatus,
        distanceMeters: res.totalDistanceMeters,
        edges: res.pathEdges || [],
        passable: res.success,
        reason: res.reason,
      });
    });

    return candidateRoutes;
  }
}

/**
 * Singleton Local Edge Service running 100% in client memory
 */
class LocalEdgeService {
  constructor() {
    this.topology = JSON.parse(JSON.stringify(DEFAULT_MINE_TOPOLOGY));
    this.engine = new LocalRouteEngine(this.topology);
    this.workerLocation = "WORK_FACE_A";
    this.workerId = "W-104";
    this.workerName = "Ramesh Naik";
    this.sosActive = false;
    this.autonomousEdgeMode = true; // Autonomous local computing
    this.localEvents = [];
    this.activeRoute = this.engine.findSafestRoute(this.workerLocation);

    // Independent multi-sensor physical hardware tracking
    this.physicalSensors = {
      flame: {
        tunnelId: "T2",
        sensorType: "FLAME",
        hazardType: "FIRE",
        active: false,
        lastSeen: 0,
        detectedAt: null,
        cooldownMs: 15000,
        currentValue: false,
      },
      gasT2: {
        tunnelId: "T2",
        sensorType: "MQ135",
        hazardType: "TOXIC_GAS",
        active: false,
        lastSeen: 0,
        detectedAt: null,
        cooldownMs: 10000,
        currentValue: 60,
      },
      gas: {
        tunnelId: "T10",
        sensorType: "MQ135",
        hazardType: "TOXIC_GAS",
        active: false,
        lastSeen: 0,
        detectedAt: null,
        cooldownMs: 10000,
        currentValue: 60,
      },
      obstacle: {
        tunnelId: "T6",
        sensorType: "HC_SR04",
        hazardType: "OBSTRUCTION",
        active: false,
        lastSeen: 0,
        detectedAt: null,
        cooldownMs: 10000,
        currentValue: 150.0,
      },
    };
    this.physicalSensors.gasT10 = this.physicalSensors.gas;

    this.physicalFireActive = false;
    this.physicalFireTunnelId = "T2";
    this.physicalFireLastSeen = 0;
    this.latestPhysicalTelemetry = null;
  }

  /**
   * Synchronize physical IoT sensor readings from ESP32 into local edge memory.
   * Concurrently tracks:
   * - T2: Flame Sensor (FIRE, 15s cooling window)
   * - T10: MQ-135 Gas Sensor (TOXIC_GAS >= 320 PPM, 10s ventilation window)
   * - T6: HC-SR04 Ultrasonic Distance (OBSTRUCTION < 25cm, 10s clearance window)
   */
  syncPhysicalTelemetry(telemetry) {
    if (!telemetry) return this.getState();

    console.log("[FRONTEND] Live sensor data received", telemetry);

    const deviceId = telemetry.deviceId || telemetry.device_id || "ESP32-MINE-NODE-01";
    const isFlame = Boolean(telemetry.flameDetected !== undefined ? telemetry.flameDetected : telemetry.flame_detected);
    const gasPpm = Number(telemetry.gasPpm !== undefined ? telemetry.gasPpm : (telemetry.mq135_value !== undefined ? telemetry.mq135_value : 60)) || 60;
    const distanceCm = Number(telemetry.distanceCm !== undefined ? telemetry.distanceCm : (telemetry.distance_cm !== undefined ? telemetry.distance_cm : 150.0)) || 150.0;
    const isSimulated = Boolean(telemetry.isSimulated);
    const isOffline = telemetry.connected === false || telemetry.status === "OFFLINE";
    const now = Date.now();

    // 1. SENSOR 1: FLAME -> TUNNEL-2 (FIRE)
    const flameSensor = this.physicalSensors.flame;
    flameSensor.currentValue = isFlame;
    if (isFlame && !isOffline) {
      if (!flameSensor.active) {
        flameSensor.detectedAt = now;
        this.logEvent(`🔥 FIRE DETECTED — TUNNEL-2: Fire detected in Tunnel 2 by ${deviceId}! Evacuation route recalculated.`);
      }
      flameSensor.active = true;
      flameSensor.lastSeen = now;
    } else {
      if (flameSensor.active) {
        const elapsed = now - flameSensor.lastSeen;
        if (elapsed >= flameSensor.cooldownMs || flameSensor.lastSeen === 0) {
          flameSensor.active = false;
          flameSensor.detectedAt = null;
          this.logEvent(`✓ FIRE CLEARED — TUNNEL-2: Tunnel 2 fire verified extinguished.`);
        }
      } else {
        flameSensor.active = false;
        flameSensor.detectedAt = null;
      }
    }

    // 2. SENSOR 2: MQ-135 GAS -> TUNNEL-10 (TOXIC_GAS)
    const gasSensor = this.physicalSensors.gas;
    gasSensor.currentValue = gasPpm;
    if (gasPpm >= 320 && !isOffline) {
      if (!gasSensor.active) {
        gasSensor.detectedAt = now;
        this.logEvent(`💨 GAS LEVEL CRITICAL — TUNNEL-10: Critical gas (${gasPpm} PPM) in Tunnel 10 by ${deviceId}!`);
      }
      gasSensor.active = true;
      gasSensor.lastSeen = now;
    } else {
      if (gasSensor.active) {
        const elapsed = now - gasSensor.lastSeen;
        if (elapsed >= gasSensor.cooldownMs || gasPpm < 180 || gasSensor.lastSeen === 0) {
          gasSensor.active = false;
          gasSensor.detectedAt = null;
          this.logEvent(`✓ GAS CLEARED — TUNNEL-10: Tunnel 10 toxic gas cleared below safe threshold.`);
        }
      } else {
        gasSensor.active = false;
        gasSensor.detectedAt = null;
      }
    }

    // 3. SENSOR 3: HC-SR04 -> TUNNEL-6 (OBSTRUCTION)
    const obsSensor = this.physicalSensors.obstacle;
    obsSensor.currentValue = distanceCm;
    const isObstacle = distanceCm < 25.0 && distanceCm >= 1.0;
    if (isObstacle && !isOffline) {
      if (!obsSensor.active) {
        obsSensor.detectedAt = now;
        this.logEvent(`⛔ OBJECT DETECTED — TUNNEL-6: Object detected (${distanceCm}cm < 25cm) in Tunnel 6 by ${deviceId}!`);
      }
      obsSensor.active = true;
      obsSensor.lastSeen = now;
    } else {
      if (obsSensor.active) {
        const elapsed = now - obsSensor.lastSeen;
        if (elapsed >= obsSensor.cooldownMs || distanceCm >= 25.0 || obsSensor.lastSeen === 0) {
          obsSensor.active = false;
          obsSensor.detectedAt = null;
          this.logEvent(`✓ OBSTACLE CLEARED — TUNNEL-6: Tunnel 6 clearance restored.`);
        }
      } else {
        obsSensor.active = false;
        obsSensor.detectedAt = null;
      }
    }

    // Sync backward-compatible fire properties
    this.physicalFireActive = flameSensor.active;
    this.physicalFireTunnelId = "T2";
    this.physicalFireLastSeen = flameSensor.lastSeen;

    // Update in-memory graph edges
    // Tunnel 2 (Flame)
    let t2Status = isOffline ? "UNKNOWN" : (flameSensor.active || isFlame ? "HAZARDOUS" : "SAFE");
    let t2Hazard = isOffline ? "SENSOR_OFFLINE" : (flameSensor.active || isFlame ? "FIRE" : null);

    console.log(`[GRAPH] Updating tunnel: TUNNEL-2 (${t2Status})`);
    this.engine.updateTunnelStatus("T2", {
      status: t2Status,
      hazardType: t2Hazard,
      flameDetected: flameSensor.active || isFlame,
      sensorActive: !isOffline,
    });

    // Tunnel 10 (Gas)
    let t10Status = "SAFE";
    let t10Hazard = null;
    if (isOffline) {
      t10Status = "UNKNOWN";
      t10Hazard = "SENSOR_OFFLINE";
    } else if (gasSensor.active || gasPpm >= 320) {
      t10Status = "HAZARDOUS";
      t10Hazard = "TOXIC_GAS";
    } else if (gasPpm >= 180) {
      t10Status = "CAUTION";
      t10Hazard = "GAS_WARNING";
    }

    console.log(`[GRAPH] Updating tunnel: TUNNEL-10 (${t10Status})`);
    this.engine.updateTunnelStatus("T10", {
      status: t10Status,
      hazardType: t10Hazard,
      gasPpm: gasSensor.currentValue,
      sensorActive: !isOffline,
    });

    // Tunnel 6 (Obstacle)
    const t6Status = isOffline ? "UNKNOWN" : (obsSensor.active || isObstacle ? "BLOCKED" : "SAFE");
    const t6Hazard = isOffline ? "SENSOR_OFFLINE" : (obsSensor.active || isObstacle ? "OBSTRUCTION" : null);

    console.log(`[GRAPH] Updating tunnel: TUNNEL-6 (${t6Status})`);
    this.engine.updateTunnelStatus("T6", {
      status: t6Status,
      hazardType: t6Hazard,
      distanceCm,
      sensorActive: !isOffline,
    });

    this.latestPhysicalTelemetry = {
      deviceId,
      flameDetected: isFlame,
      gasPpm,
      distanceCm,
      isSimulated,
      timestamp: new Date().toLocaleTimeString(),
      sensors: {
        T2: { hazard: t2Hazard, status: t2Status, flame: isFlame, gasPpm: this.physicalSensors.gasT2?.currentValue || 60 },
        T10: { hazard: t10Hazard, status: t10Status, gasPpm: this.physicalSensors.gas.currentValue },
        T6: { hazard: obsSensor.active ? "OBSTRUCTION" : null, status: obsSensor.active ? "BLOCKED" : "SAFE", distanceCm },
      },
    };

    // Instant local Dijkstra route recalculation (< 1ms)
    this.recalculateRoute();

    return this.getState();
  }

  /**
   * Manually toggle or set hazard on a tunnel
   */
  setTunnelHazard(tunnelId, hazardType, customPpm = null, customDist = null) {
    let update = {};

    switch (hazardType) {
      case "FIRE":
        update = {
          status: "HAZARDOUS",
          hazardType: "FIRE",
          flameDetected: true,
          gasPpm: customPpm || 240,
          distanceCm: 150,
          sensorActive: true,
        };
        this.logEvent(`🔥 Fire detected manually in Tunnel ${tunnelId}. Marked HAZARDOUS.`);
        break;

      case "GAS":
        update = {
          status: "HAZARDOUS",
          hazardType: "TOXIC_GAS",
          flameDetected: false,
          gasPpm: customPpm || 450,
          distanceCm: 150,
          sensorActive: true,
        };
        this.logEvent(`💨 Critical toxic gas (${update.gasPpm} PPM) in Tunnel ${tunnelId}. Marked HAZARDOUS.`);
        break;

      case "CAUTION_GAS":
        update = {
          status: "CAUTION",
          hazardType: "GAS_WARNING",
          flameDetected: false,
          gasPpm: customPpm || 210,
          distanceCm: 150,
          sensorActive: true,
        };
        this.logEvent(`⚠️ Elevated gas warning in Tunnel ${tunnelId}. Marked CAUTION.`);
        break;

      case "BLOCKED":
        update = {
          status: "BLOCKED",
          hazardType: "OBSTRUCTION",
          flameDetected: false,
          gasPpm: 75,
          distanceCm: customDist || 14.0,
          sensorActive: true,
        };
        this.logEvent(`⛔ Rockfall obstruction (<25cm) in Tunnel ${tunnelId}. Marked BLOCKED.`);
        break;

      case "OFFLINE":
        update = {
          status: "UNKNOWN",
          hazardType: "SENSOR_OFFLINE",
          flameDetected: false,
          gasPpm: 0,
          distanceCm: 0,
          sensorActive: false,
        };
        this.logEvent(`⚪ Sensor offline in Tunnel ${tunnelId}. Marked UNKNOWN (safety unverified).`);
        break;

      case "SAFE":
      default:
        update = {
          status: "SAFE",
          hazardType: null,
          flameDetected: false,
          gasPpm: 60,
          distanceCm: 160,
          sensorActive: true,
        };
        this.logEvent(`✓ Tunnel ${tunnelId} cleared of hazards. Restored to SAFE.`);
        break;
    }

    this.engine.updateTunnelStatus(tunnelId, update);
    this.recalculateRoute();
    return this.getState();
  }

  /**
   * Move worker manually to any node
   */
  setWorkerLocation(nodeId) {
    if (!this.engine.nodes.has(nodeId)) return false;
    this.workerLocation = nodeId;
    const node = this.engine.nodes.get(nodeId);
    this.logEvent(`👷 Worker relocated to ${node.name}.`);
    this.recalculateRoute();
    return this.getState();
  }

  /**
   * Recalculate safest route on the local edge
   */
  recalculateRoute() {
    const prevExit = this.activeRoute?.targetExitId;
    this.activeRoute = this.engine.findSafestRoute(this.workerLocation);

    if (this.activeRoute && prevExit && prevExit !== this.activeRoute.targetExitId) {
      this.logEvent(`⚡ ROUTE ALTERED: Redirected from ${prevExit} to ${this.activeRoute.targetExitName || "Refuge"}!`);
    }

    return this.activeRoute;
  }

  /**
   * Trigger SOS panic beacon
   */
  triggerSOS() {
    this.sosActive = true;
    this.logEvent(`🚨 SOS PANIC BEACON ACTIVATED at ${this.workerLocation}!`);
    return this.getState();
  }

  acknowledgeSOS() {
    this.sosActive = false;
    this.logEvent(`✓ SOS signal acknowledged and stood down.`);
    return this.getState();
  }

  /**
   * Reset all tunnels to clean initial state
   */
  resetToSafeDefaults(forceClearAll = false) {
    this.topology = JSON.parse(JSON.stringify(DEFAULT_MINE_TOPOLOGY));
    this.engine.loadTopology(this.topology);
    this.workerLocation = "WORK_FACE_A";
    this.sosActive = false;

    const now = Date.now();
    if (forceClearAll) {
      this.physicalSensors.flame.active = false;
      this.physicalSensors.flame.detectedAt = null;
      this.physicalSensors.gas.active = false;
      this.physicalSensors.gas.detectedAt = null;
      this.physicalSensors.obstacle.active = false;
      this.physicalSensors.obstacle.detectedAt = null;
      this.physicalFireActive = false;
      this.latestPhysicalTelemetry = null;
    } else {
      if (this.physicalSensors.flame.active && now - this.physicalSensors.flame.lastSeen < this.physicalSensors.flame.cooldownMs) {
        this.engine.updateTunnelStatus("T2", {
          status: "HAZARDOUS",
          hazardType: "FIRE",
          flameDetected: true,
        });
        this.logEvent(`🔥 Preserved active physical IoT fire in Tunnel T2 during reset.`);
      } else {
        this.physicalSensors.flame.active = false;
        this.physicalSensors.flame.detectedAt = null;
        this.physicalFireActive = false;
      }

      if (this.physicalSensors.gas.active && this.physicalSensors.gas.currentValue >= 320 && now - this.physicalSensors.gas.lastSeen < this.physicalSensors.gas.cooldownMs) {
        this.engine.updateTunnelStatus("T10", {
          status: "HAZARDOUS",
          hazardType: "TOXIC_GAS",
          gasPpm: this.physicalSensors.gas.currentValue,
        });
        this.logEvent(`💨 Preserved active physical IoT toxic gas in Tunnel T10 during reset.`);
      } else {
        this.physicalSensors.gas.active = false;
        this.physicalSensors.gas.detectedAt = null;
      }

      if (this.physicalSensors.obstacle.active && this.physicalSensors.obstacle.currentValue < 25.0 && now - this.physicalSensors.obstacle.lastSeen < this.physicalSensors.obstacle.cooldownMs) {
        this.engine.updateTunnelStatus("T6", {
          status: "BLOCKED",
          hazardType: "OBSTRUCTION",
          distanceCm: this.physicalSensors.obstacle.currentValue,
        });
        this.logEvent(`⛔ Preserved active physical IoT rockfall obstruction in Tunnel T6 during reset.`);
      } else {
        this.physicalSensors.obstacle.active = false;
        this.physicalSensors.obstacle.detectedAt = null;
      }
    }

    this.recalculateRoute();
    this.logEvent(`🔄 Local edge topology reset to initial clear mining state.`);
    return this.getState();
  }

  logEvent(msg) {
    this.localEvents.unshift({
      id: "LEVT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      message: msg,
      timestamp: new Date().toLocaleTimeString(),
    });
    if (this.localEvents.length > 30) this.localEvents.pop();
  }

  getState() {
    // Auto-expire physical hazards if cooldown has passed or values are normal
    const now = Date.now();
    let edgeChanged = false;

    if (this.physicalSensors.flame.active && (now - this.physicalSensors.flame.lastSeen >= this.physicalSensors.flame.cooldownMs || !this.physicalSensors.flame.currentValue)) {
      this.physicalSensors.flame.active = false;
      this.physicalSensors.flame.detectedAt = null;
      this.physicalFireActive = false;
      edgeChanged = true;
    }

    if (this.physicalSensors.gasT2 && this.physicalSensors.gasT2.active && (this.physicalSensors.gasT2.currentValue < 320 || now - this.physicalSensors.gasT2.lastSeen >= this.physicalSensors.gasT2.cooldownMs)) {
      this.physicalSensors.gasT2.active = false;
      this.physicalSensors.gasT2.detectedAt = null;
      edgeChanged = true;
    }

    if (!this.physicalSensors.flame.active && (!this.physicalSensors.gasT2 || !this.physicalSensors.gasT2.active)) {
      this.engine.updateTunnelStatus("T2", { status: "SAFE", hazardType: null, flameDetected: false });
    }

    if (this.physicalSensors.gas.active && (this.physicalSensors.gas.currentValue < 320 || now - this.physicalSensors.gas.lastSeen >= this.physicalSensors.gas.cooldownMs)) {
      this.physicalSensors.gas.active = false;
      this.physicalSensors.gas.detectedAt = null;
      const t10Status = this.physicalSensors.gas.currentValue >= 180 ? "CAUTION" : "SAFE";
      const t10Hazard = this.physicalSensors.gas.currentValue >= 180 ? "GAS_WARNING" : null;
      this.engine.updateTunnelStatus("T10", { status: t10Status, hazardType: t10Hazard, gasPpm: this.physicalSensors.gas.currentValue });
      edgeChanged = true;
    }

    if (this.physicalSensors.obstacle.active && (this.physicalSensors.obstacle.currentValue >= 25.0 || now - this.physicalSensors.obstacle.lastSeen >= this.physicalSensors.obstacle.cooldownMs)) {
      this.physicalSensors.obstacle.active = false;
      this.physicalSensors.obstacle.detectedAt = null;
      this.engine.updateTunnelStatus("T6", { status: "SAFE", hazardType: null, distanceCm: this.physicalSensors.obstacle.currentValue });
      edgeChanged = true;
    }

    if (edgeChanged) {
      this.recalculateRoute();
    }

    const nodes = Array.from(this.engine.nodes.values()).map((n) => ({
      ...n,
      workers: n.id === this.workerLocation ? [{ workerId: this.workerId, name: this.workerName, sosActive: this.sosActive }] : [],
    }));

    const edges = Array.from(this.engine.edges.values());
    const alternates = this.engine.evaluateAllPotentialRoutes(this.workerLocation);

    // Active hazard headers for Smartwatch HUD and Edge banner display
    const activeHazardHeaders = [];
    const edgeT2 = this.engine.edges.get("T2");
    const edgeT10 = this.engine.edges.get("T10");
    const edgeT6 = this.engine.edges.get("T6");

    if (this.physicalSensors.flame.active || (edgeT2?.status === "HAZARDOUS" && edgeT2?.hazardType === "FIRE") || edgeT2?.flameDetected) {
      activeHazardHeaders.push("FIRE DETECTED — TUNNEL T2");
    }
    if (this.physicalSensors.gasT2?.active || (edgeT2?.status === "HAZARDOUS" && (edgeT2?.hazardType === "TOXIC_GAS" || edgeT2?.gasPpm >= 320))) {
      activeHazardHeaders.push("DANGEROUS GAS DETECTED — TUNNEL T2");
    }
    if (this.physicalSensors.gas.active || (edgeT10?.status === "HAZARDOUS" && (edgeT10?.hazardType === "TOXIC_GAS" || edgeT10?.gasPpm >= 320))) {
      activeHazardHeaders.push("DANGEROUS GAS DETECTED — TUNNEL T10");
    }
    if (this.physicalSensors.obstacle.active || (edgeT6?.status === "BLOCKED" && edgeT6?.hazardType === "OBSTRUCTION") || (edgeT6?.distanceCm < 25.0 && edgeT6?.distanceCm > 0)) {
      activeHazardHeaders.push("OBSTACLE DETECTED — TUNNEL T6");
    }
    if (this.activeRoute?.routeStatus === "NO VERIFIED SAFE ROUTE" || !this.activeRoute?.success) {
      activeHazardHeaders.push("NO SAFE ROUTE AVAILABLE — STOP AND FOLLOW EMERGENCY PROTOCOL");
    }

    return {
      isAutonomousEdge: this.autonomousEdgeMode,
      workerId: this.workerId,
      workerName: this.workerName,
      workerLocation: this.workerLocation,
      sosActive: this.sosActive,
      nodes,
      edges,
      viewBox: this.topology.coordinateSystem.viewBox,
      latestPhysicalTelemetry: this.latestPhysicalTelemetry,
      physicalSensors: this.physicalSensors,
      physicalFireActive: this.physicalSensors.flame.active,
      physicalFireTunnelId: "T2",
      activeHazardHeaders,
      activeRoute: {
        ...this.activeRoute,
        workerId: this.workerId,
        workerName: this.workerName,
        locationNode: this.workerLocation,
        sosActive: this.sosActive,
      },
      alternateRoutes: alternates,
      events: this.localEvents,
    };
  }
}

export const localEdgeService = new LocalEdgeService();

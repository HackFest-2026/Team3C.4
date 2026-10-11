/**
 * MINEGUARD SAFE EVACUATION ROUTE ENGINE
 * Dynamic Graph-based Route Optimizer for Underground Mine Safety
 *
 * Implements Dijkstra-based pathfinding with safety-cost weighting,
 * hazard exclusion, dynamic rerouting detection, and verified-safe validation.
 */

class RouteEngine {
  constructor(topology) {
    this.nodes = new Map(); // nodeId -> { id, name, type, x, y, isExit, isRefuge }
    this.edges = new Map(); // edgeId -> { id, from, to, lengthMeters, status, hazardType, sensorActive, ... }
    this.adjacency = new Map(); // nodeId -> Array<{ edgeId, neighborId, weight, ... }>

    if (topology) {
      this.loadTopology(topology);
    }
  }

  /**
   * Load or replace the mine topology
   * @param {Object} topology - { nodes: [...], edges: [...] }
   */
  loadTopology(topology) {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();

    if (!topology || !Array.isArray(topology.nodes) || !Array.isArray(topology.edges)) {
      throw new Error("Invalid topology format: expected { nodes: [], edges: [] }");
    }

    // Register nodes
    topology.nodes.forEach((node) => {
      this.nodes.set(node.id, {
        id: node.id,
        name: node.name || node.id,
        type: node.type || "JUNCTION", // "EXIT" | "JUNCTION" | "WORK_FACE" | "REFUGE" | "SHAFT"
        isExit: Boolean(node.isExit || node.type === "EXIT"),
        isRefuge: Boolean(node.isRefuge || node.type === "REFUGE"),
        x: Number(node.x || 0),
        y: Number(node.y || 0),
        zone: node.zone || "Mine Section",
      });
      this.adjacency.set(node.id, []);
    });

    // Register edges
    topology.edges.forEach((edge) => {
      if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
        console.warn(`[RouteEngine] Edge ${edge.id} references non-existent node: ${edge.from} -> ${edge.to}`);
        return;
      }

      const edgeRecord = {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        name: edge.name || `Tunnel ${edge.id}`,
        lengthMeters: Math.max(1, Number(edge.lengthMeters || 50)),
        status: edge.status || "SAFE", // "SAFE" | "CAUTION" | "HAZARDOUS" | "BLOCKED" | "UNKNOWN"
        hazardType: edge.hazardType || null, // "FIRE" | "TOXIC_GAS" | "OBSTRUCTION" | "SENSOR_OFFLINE" | null
        flameDetected: Boolean(edge.flameDetected),
        gasPpm: Number(edge.gasPpm || 0),
        distanceCm: Number(edge.distanceCm || 100),
        sensorActive: edge.sensorActive !== undefined ? Boolean(edge.sensorActive) : true,
        lastUpdated: edge.lastUpdated || new Date().toISOString(),
        bidirectional: edge.bidirectional !== false,
      };

      this.edges.set(edge.id, edgeRecord);

      // Add to adjacency list (forward)
      this.adjacency.get(edge.from).push({
        edgeId: edge.id,
        neighborId: edge.to,
      });

      // Add to adjacency list (reverse if bidirectional)
      if (edgeRecord.bidirectional) {
        this.adjacency.get(edge.to).push({
          edgeId: edge.id,
          neighborId: edge.from,
        });
      }
    });
  }

  standardizeTunnelId(edgeId) {
    if (!edgeId) return "";
    const str = String(edgeId).trim().toUpperCase();
    if (str.startsWith("TUNNEL-") || str.startsWith("TUNNEL_") || str.startsWith("TUNNEL ")) {
      return "T" + str.replace(/^TUNNEL[\s_-]*/, "");
    }
    return str;
  }

  /**
   * Update the status and hazard metadata of a specific tunnel
   * @param {string} edgeId
   * @param {Object} update
   */
  updateTunnelStatus(edgeId, update) {
    const id = this.standardizeTunnelId(edgeId);
    let edge = this.edges.get(id) || this.edges.get(edgeId);
    if (!edge) {
      return false;
    }

    Object.assign(edge, update, { lastUpdated: new Date().toISOString() });
    return true;
  }

  /**
   * Calculate deterministic traversal cost for an edge
   * Returns Infinity if edge is strictly impassable.
   */
  getEdgeCost(edge) {
    // 1. Strict Exclusion: Hazardous or Blocked tunnels cannot be traversed
    if (edge.status === "HAZARDOUS" || edge.status === "BLOCKED") {
      return Infinity;
    }
    if (edge.flameDetected) {
      return Infinity;
    }
    if (edge.gasPpm >= 320) {
      return Infinity;
    }
    if (edge.distanceCm < 25.0 && edge.distanceCm > 0) {
      return Infinity;
    }

    // Base cost is real physical distance in meters
    let cost = edge.lengthMeters;

    // 2. Risk Penalties:
    // If caution (e.g. gas between 180 and 320 PPM), apply high risk cost
    if (edge.status === "CAUTION" || (edge.gasPpm >= 180 && edge.gasPpm < 320)) {
      cost += 500; // Strong disincentive, but passable if only escape
    }

    // If unknown / sensor offline, penalize so verified routes are chosen first
    if (edge.status === "UNKNOWN" || !edge.sensorActive) {
      cost += 250;
    }

    return cost;
  }

  /**
   * Calculate safest evacuation route from a worker location to any available surface exit.
   *
   * @param {string} startNodeId - Node where worker is located
   * @param {Object} options - { preferredExitId, allowUnverified }
   * @returns {Object} Route result
   */
  findSafestRoute(startNodeId, options = {}) {
    const startTime = Date.now();

    if (!this.nodes.has(startNodeId)) {
      return {
        success: false,
        routeStatus: "NO VERIFIED SAFE ROUTE",
        reason: `Starting location node '${startNodeId}' is not registered in the mine map.`,
        pathNodes: [],
        pathEdges: [],
        totalDistanceMeters: 0,
        instructions: [],
        timestamp: new Date().toISOString(),
      };
    }

    // If already at an exit
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
        computationTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    // Collect all valid target exits
    const exitNodes = Array.from(this.nodes.values()).filter((n) => n.isExit);
    if (exitNodes.length === 0) {
      return {
        success: false,
        routeStatus: "NO VERIFIED SAFE ROUTE",
        reason: "No exit nodes configured in the underground mine layout.",
        pathNodes: [],
        pathEdges: [],
        totalDistanceMeters: 0,
        instructions: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Run Dijkstra's algorithm from startNodeId
    const distances = new Map();
    const previous = new Map(); // nodeId -> { prevNodeId, edgeId }
    const unvisited = new Set(this.nodes.keys());

    this.nodes.forEach((_, nodeId) => {
      distances.set(nodeId, Infinity);
    });
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const d = distances.get(nodeId);
        if (d < minDistance) {
          minDistance = d;
          current = nodeId;
        }
      }

      if (current === null || minDistance === Infinity) {
        break; // All remaining unvisited nodes are unreachable
      }

      unvisited.delete(current);

      // Check neighbors
      const neighbors = this.adjacency.get(current) || [];
      for (const { edgeId, neighborId } of neighbors) {
        if (!unvisited.has(neighborId)) continue;

        const edge = this.edges.get(edgeId);
        const weight = this.getEdgeCost(edge);

        if (weight === Infinity) {
          continue; // Blocked or hazardous edge
        }

        const alt = distances.get(current) + weight;
        if (alt < distances.get(neighborId)) {
          distances.set(neighborId, alt);
          previous.set(neighborId, { prevNodeId: current, edgeId });
        }
      }
    }

    // Evaluate available exits reached
    let bestExit = null;
    let lowestCost = Infinity;

    for (const exit of exitNodes) {
      const cost = distances.get(exit.id);
      if (cost < lowestCost) {
        lowestCost = cost;
        bestExit = exit;
      }
    }

    // If no exit was reached, check if worker can reach a designated Refuge Chamber
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
        // Reconstruct path to refuge
        const refugePath = this.reconstructPath(startNodeId, bestRefuge.id, previous);
        return {
          success: false,
          routeStatus: "NO VERIFIED SAFE ROUTE TO SURFACE",
          secondaryProtocol: "SEEK DESIGNATED REFUGE CHAMBER",
          reason: `All surface exits are cut off by active hazards or blockages. Immediate fallback route directed to ${bestRefuge.name}.`,
          targetExitId: null,
          refugeId: bestRefuge.id,
          refugeName: bestRefuge.name,
          pathNodes: refugePath.nodes,
          pathEdges: refugePath.edges,
          totalDistanceMeters: refugePath.physicalDistance,
          nextAction: `PROCEED IMMEDIATELY TO REFUGE CHAMBER [${bestRefuge.name}]`,
          instructions: refugePath.instructions,
          unverifiedSegments: refugePath.unverifiedSegments,
          computationTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        routeStatus: "NO VERIFIED SAFE ROUTE",
        reason: "All evacuation paths are blocked, hazardous, or disconnected. No passable route to any surface exit or refuge bay exists.",
        pathNodes: [startNodeId],
        pathEdges: [],
        totalDistanceMeters: 0,
        nextAction: "TAKE SHELTER IMMEDIATELY — SOUND PERSONAL SOS BEACON",
        instructions: [
          {
            step: 1,
            action: "EMERGENCY: All escape tunnels compromised. Halt movement, engage self-rescuer respirator, and activate SOS distress signal.",
            distance: 0,
          },
        ],
        unverifiedSegments: [],
        computationTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }

    // Reconstruct best route to exit
    const pathResult = this.reconstructPath(startNodeId, bestExit.id, previous);

    // Determine verification status:
    // If any traversed edge has UNKNOWN status or inactive sensors, route is "SAFETY UNVERIFIED"
    const hasUnverified = pathResult.unverifiedSegments.length > 0;
    const routeStatus = hasUnverified ? "SAFETY UNVERIFIED" : "VERIFIED SAFE";

    let reasonMsg = `Verified safe path to ${bestExit.name} (${pathResult.physicalDistance}m) avoiding all identified hazard zones.`;
    if (hasUnverified) {
      reasonMsg = `Route established to ${bestExit.name} (${pathResult.physicalDistance}m), but segments [${pathResult.unverifiedSegments.join(
        ", "
      )}] have offline or unmonitored sensors. Exercise extreme caution.`;
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
      computationTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reconstruct path nodes and generate turn-by-turn guidance
   */
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

    // Calculate physical distance & check verification
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

      // Generate human-readable direction instruction
      let directionVerb = index === 0 ? "HEAD TOWARDS" : "CONTINUE THROUGH";
      if (toNode.isExit) {
        directionVerb = "EVACUATE OUT VIA";
      }

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
   * Check if a route update represents a significant change for a worker
   * @param {Object} oldRoute
   * @param {Object} newRoute
   * @returns {boolean}
   */
  hasRouteChanged(oldRoute, newRoute) {
    if (!oldRoute || !newRoute) return true;
    if (oldRoute.routeStatus !== newRoute.routeStatus) return true;
    if (oldRoute.targetExitId !== newRoute.targetExitId) return true;

    const oldEdges = oldRoute.pathEdges || [];
    const newEdges = newRoute.pathEdges || [];
    if (oldEdges.length !== newEdges.length) return true;

    for (let i = 0; i < oldEdges.length; i++) {
      if (oldEdges[i] !== newEdges[i]) return true;
    }
    return false;
  }
}

module.exports = RouteEngine;

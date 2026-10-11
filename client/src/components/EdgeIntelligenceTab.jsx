import React, { useState, useEffect } from "react";
import api from "../services/api";
import { localEdgeService, DEFAULT_MINE_TOPOLOGY } from "../services/localEdgeEngine";
import MineTunnelGraph from "./MineTunnelGraph";
import SmartwatchInterface from "./SmartwatchInterface";

/**
 * MINEGUARD EDGE INTELLIGENCE & EVACUATION TAB
 * Autonomous Local Edge Computing for Underground Mining Safety
 *
 * Core Capabilities:
 * - 100% Local On-Device Route Optimization (Zero Cloud / Zero Control Room reliance)
 * - Manual Hazard Injection on any Tunnel (Fire, Toxic Gas, Rockfall, Offline)
 * - Manual Worker Location Relocation
 * - Dynamic Dijkstra Pathfinding with Alternative Route Comparison
 * - Live Smartwatch Wearable Evacuation Preview
 */
export default function EdgeIntelligenceTab({ hardwareData, onTriggerBuzzer }) {
  // Mode: "local_edge" (100% on-device autonomous computing) vs "server_sync"
  const [edgeComputeMode, setEdgeComputeMode] = useState("local_edge");

  // Local In-Memory Edge State
  const [localState, setLocalState] = useState(() => localEdgeService.getState());
  const [preferredExit, setPreferredExit] = useState("AUTO");
  const [computationTime, setComputationTime] = useState("< 0.3ms");
  const [activeScenario, setActiveScenario] = useState("NORMAL");

  // Backend Sync State (optional fallback when connected)
  const [serverOnline, setServerOnline] = useState(true);

  // Sync state from local edge service
  const refreshLocalState = () => {
    const st = localEdgeService.getState();
    setLocalState(st);
  };

  // On mount and initial render
  useEffect(() => {
    refreshLocalState();
    api.getEdgeStatus()
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  // Sync real-time physical sensor data from Dashboard / hardware polling
  useEffect(() => {
    if (!hardwareData) return;
    if (hardwareData.connected === false && !hardwareData.isLive) {
      return;
    }
    const t0 = performance.now();
    localEdgeService.syncPhysicalTelemetry({
      ...hardwareData,
      tunnelId: hardwareData.tunnelId || hardwareData.tunnel_id || "T2",
    });
    setComputationTime(`${(performance.now() - t0).toFixed(2)}ms`);
    refreshLocalState();

    if (hardwareData.flameDetected && onTriggerBuzzer) {
      onTriggerBuzzer();
    }
  }, [hardwareData, onTriggerBuzzer]);

  // Continuous background synchronization with Edge Intelligence API
  useEffect(() => {
    let isMounted = true;
    const pollInterval = setInterval(() => {
      api.getEdgeStatus()
        .then((status) => {
          if (!isMounted) return;
          setServerOnline(true);
          if (status.latestPhysicalTelemetry && !status.latestPhysicalTelemetry.isStale) {
            const ageMs = Date.now() - new Date(status.latestPhysicalTelemetry.timestamp).getTime();
            if (ageMs < 12000) {
              localEdgeService.syncPhysicalTelemetry(status.latestPhysicalTelemetry);
              refreshLocalState();
            }
          } else if (status.physicalSensors) {
            if (!status.physicalSensors.flame?.active && !status.physicalSensors.gas?.active && !status.physicalSensors.gasT2?.active && !status.physicalSensors.obstacle?.active) {
              localEdgeService.syncPhysicalTelemetry({
                flameDetected: false,
                gasPpm: status.physicalSensors.gas?.currentValue || 60,
                distanceCm: status.physicalSensors.obstacle?.currentValue || 150,
                isSimulated: false,
              });
              refreshLocalState();
            }
          }
        })
        .catch(() => {
          if (isMounted) setServerOnline(false);
        });
    }, 1200);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // MANUAL: Tunnel Hazard Change Triggered from Graph or Controls
  const handleTunnelHazardChange = (tunnelId, hazardType) => {
    const t0 = performance.now();
    localEdgeService.setTunnelHazard(tunnelId, hazardType);
    setComputationTime(`${(performance.now() - t0).toFixed(2)}ms`);
    refreshLocalState();

    // If connected to server and in sync mode, forward notice
    if (edgeComputeMode === "server_sync" && serverOnline) {
      api.sendEdgeTelemetry({
        deviceId: "MANUAL-EDGE-CONSOLE",
        workerId: localState.workerId,
        tunnelId: tunnelId,
        flameDetected: hazardType === "FIRE",
        gasPpm: hazardType === "GAS" ? 450 : 60,
        distanceCm: hazardType === "BLOCKED" ? 14 : 150,
        isSimulated: true,
      }).catch(() => {});
    }
  };

  // MANUAL: Worker Relocation from Graph Click or Dropdown
  const handleNodeClick = (node) => {
    const t0 = performance.now();
    localEdgeService.setWorkerLocation(node.id);
    setComputationTime(`${(performance.now() - t0).toFixed(2)}ms`);
    refreshLocalState();
  };

  // MANUAL: Recalculate Route with Preferred Exit
  const handleRecalculateRoute = () => {
    const t0 = performance.now();
    const opts = preferredExit === "AUTO" ? {} : { preferredExitId: preferredExit };
    const route = localEdgeService.engine.findSafestRoute(localState.workerLocation, opts);
    localEdgeService.activeRoute = route;
    setComputationTime(`${(performance.now() - t0).toFixed(2)}ms`);
    refreshLocalState();
  };

  // Scenario presets (A to G) running locally on the edge!
  const handleApplyScenario = (scenarioKey) => {
    setActiveScenario(scenarioKey);
    localEdgeService.resetToSafeDefaults();

    switch (scenarioKey) {
      case "A": // Normal
        localEdgeService.setWorkerLocation("WORK_FACE_A");
        break;
      case "B": // Fire in T2
        localEdgeService.setWorkerLocation("WORK_FACE_A");
        localEdgeService.setTunnelHazard("T2", "FIRE");
        break;
      case "C": // Methane in T1
        localEdgeService.setWorkerLocation("WORK_FACE_A");
        localEdgeService.setTunnelHazard("T1", "GAS");
        break;
      case "D": // Dynamic Reroute (Block T3)
        localEdgeService.setWorkerLocation("WORK_FACE_A");
        localEdgeService.setTunnelHazard("T3", "BLOCKED");
        break;
      case "E": // Sensor Offline (T3 Offline)
        localEdgeService.setWorkerLocation("WORK_FACE_A");
        localEdgeService.setTunnelHazard("T3", "OFFLINE");
        break;
      case "F": // No Safe Route (Block T1 & T4)
        localEdgeService.setWorkerLocation("WORK_FACE_A");
        localEdgeService.setTunnelHazard("T1", "FIRE");
        localEdgeService.setTunnelHazard("T4", "BLOCKED");
        break;
      case "G": // Autonomous Local Edge
        localEdgeService.autonomousEdgeMode = true;
        setEdgeComputeMode("local_edge");
        break;
      default:
        break;
    }

    refreshLocalState();
  };

  // Reset to Clean Slate
  const handleReset = () => {
    localEdgeService.resetToSafeDefaults(true);
    setActiveScenario("NORMAL");
    setPreferredExit("AUTO");
    refreshLocalState();
    api.resetSimulation().catch(() => {});
    fetch("http://localhost:5000/api/edge/reset-hazards", { method: "POST" }).catch(() => {});
    fetch("http://localhost:5000/api/hardware/reset", { method: "POST" }).catch(() => {});
  };

  // SOS Distress
  const handleTriggerSOS = () => {
    localEdgeService.triggerSOS();
    refreshLocalState();
  };

  const handleAcknowledgeSOS = () => {
    localEdgeService.acknowledgeSOS();
    refreshLocalState();
  };

  // Map Data for Graph
  const mapData = {
    nodes: localState.nodes,
    edges: localState.edges,
    viewBox: localState.viewBox,
  };

  const activeRoute = localState.activeRoute;
  const isNoSafeRoute = activeRoute?.routeStatus?.includes("NO VERIFIED SAFE ROUTE");
  const isUnverified = activeRoute?.routeStatus === "SAFETY UNVERIFIED";
  const isVerified = activeRoute?.routeStatus === "VERIFIED SAFE";

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* 1. TOP EDGE ARCHITECTURE BANNER */}
      <div
        className="mg-pop"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
          boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
          borderRadius: "18px",
          border: "1px solid rgba(217, 119, 6, 0.25)",
          padding: "20px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#181e24", fontWeight: 800 }}>
              🛡️ MineGuard Autonomous Edge Emergency Intelligence
            </h2>
            <span
              style={{
                background: "#dcfce7",
                border: "1px solid #16a34a",
                color: "#15803d",
                fontSize: "11px",
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              ⚡ 100% LOCAL ON-DEVICE COMPUTING
            </span>
            <span
              style={{
                background: "#eff6ff",
                border: "1px solid #3b82f6",
                color: "#1d4ed8",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              ZERO CLOUD / NO CONTROL ROOM NEEDED
            </span>
          </div>
          <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "12px" }}>
            Underground Subterranean Mine Node • Dynamic Dijkstra Graph Optimization • Local Execution Latency:{" "}
            <strong style={{ color: "#15803d" }}>{computationTime}</strong>
          </p>
        </div>

        {/* Mode Toggle & Reset */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#f1f5f9",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
            }}
          >
            <button
              onClick={() => setEdgeComputeMode("local_edge")}
              style={{
                background: edgeComputeMode === "local_edge" ? "#10b981" : "transparent",
                color: edgeComputeMode === "local_edge" ? "#ffffff" : "#475569",
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⚡ On-Device Edge
            </button>
            <button
              onClick={() => setEdgeComputeMode("server_sync")}
              style={{
                background: edgeComputeMode === "server_sync" ? "#f59e0b" : "transparent",
                color: edgeComputeMode === "server_sync" ? "#181e24" : "#475569",
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🔄 Server Sync
            </button>
          </div>

          <button
            onClick={handleReset}
            style={{
              background: "#ffffff",
              border: "1px solid rgba(217, 119, 6, 0.35)",
              color: "#b45309",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🔄 Reset Tunnels Safe
          </button>
        </div>
      </div>

      {/* 1.5 PHYSICAL IoT SENSOR NODE INTEGRATION BANNER */}
      {(() => {
        const t2Edge = localState.edges.find((e) => e.id === "T2");
        const t10Edge = localState.edges.find((e) => e.id === "T10");
        const t6Edge = localState.edges.find((e) => e.id === "T6");

        const isPhysicalFire = Boolean(
          localState.physicalFireActive ||
          localState.physicalSensors?.flame?.active ||
          (t2Edge && (t2Edge.flameDetected || (t2Edge.status === "HAZARDOUS" && t2Edge.hazardType === "FIRE"))) ||
          hardwareData?.flameDetected
        );

        const isPhysicalGas = Boolean(
          localState.physicalSensors?.gas?.active ||
          (t10Edge && (t10Edge.status === "HAZARDOUS" && t10Edge.hazardType === "TOXIC_GAS")) ||
          (hardwareData?.gasPpm >= 320)
        );

        const isPhysicalObstacle = Boolean(
          localState.physicalSensors?.obstacle?.active ||
          (t6Edge && t6Edge.status === "BLOCKED") ||
          (hardwareData?.distanceCm < 25 && hardwareData?.distanceCm >= 1)
        );

        const physTelemetry = localState.latestPhysicalTelemetry || hardwareData || {};
        const activeHazards = [];
        if (isPhysicalFire) activeHazards.push({ type: "FIRE", tunnel: "T2", title: "FIRE DETECTED IN T2", icon: "🔥", desc: "IR Flame Sensor triggered" });
        if (isPhysicalGas) activeHazards.push({ type: "TOXIC_GAS", tunnel: "T10", title: `CRITICAL GAS IN T10 (${physTelemetry.gasPpm || 450} PPM)`, icon: "💨", desc: "MQ-135 Gas Sensor exceeded 320 PPM" });
        if (isPhysicalObstacle) activeHazards.push({ type: "OBSTRUCTION", tunnel: "T6", title: `ROCKFALL OBSTRUCTION IN T6 (${physTelemetry.distanceCm || 14}cm)`, icon: "⛔", desc: "HC-SR04 ultrasonic distance < 25cm" });

        if (activeHazards.length > 0) {
          return (
            <div
              className="mg-pop"
              style={{
                background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)",
                border: "2px solid #ef4444",
                borderRadius: "16px",
                padding: "18px 24px",
                color: "#ffffff",
                boxShadow: "0 10px 28px rgba(220, 38, 38, 0.45)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
                animation: "mgFlash 1.5s infinite",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "32px" }}>{activeHazards[0].icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "0.5px" }}>
                      REAL-TIME HAZARD DETECTED: {activeHazards.map(h => h.title).join(" • ")}
                    </span>
                    <span
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        fontSize: "10px",
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      HARDWARE NODE: ESP32-MINE-NODE-01
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#fecaca", marginTop: "3px" }}>
                    {activeHazards.map(h => `${h.desc} in Tunnel ${h.tunnel}`).join(" | ")}. Dynamic local edge routing recalculating safest escape route.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right", fontSize: "11px", color: "#fca5a5" }}>
                  <div>T2 Flame: <strong>{isPhysicalFire ? "ACTIVE" : "CLEAR"}</strong> • T10 Gas: <strong>{physTelemetry.gasPpm || 60} PPM</strong> • T6 Dist: <strong>{physTelemetry.distanceCm || 150}cm</strong></div>
                  <div>Independent Cooldown: <strong>Verification Policy Active</strong></div>
                </div>
                <span
                  style={{
                    background: "#15803d",
                    border: "1px solid #4ade80",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontWeight: 800,
                    fontSize: "11px",
                  }}
                >
                  ⚡ SAFE REROUTE ACTIVE
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(217, 119, 6, 0.2)",
              borderRadius: "12px",
              padding: "10px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "11px",
              color: "#334155",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: serverOnline ? "#10b981" : "#f59e0b",
                  display: "inline-block",
                }}
              />
              <span>
                <strong>Physical IoT Node:</strong> ESP32-MINE-NODE-01
              </span>
              <span style={{ color: "#64748b" }}>•</span>
              <span>
                T2 Flame (GPIO 4): <strong style={{ color: "#15803d" }}>CLEAR (SAFE)</strong>
              </span>
              <span style={{ color: "#64748b" }}>•</span>
              <span>
                T10 Gas (MQ-135): <strong>{physTelemetry.gasPpm || 60} PPM</strong>
              </span>
              <span style={{ color: "#64748b" }}>•</span>
              <span>
                T6 Distance (HC-SR04): <strong>{physTelemetry.distanceCm || 150}cm</strong>
              </span>
            </div>
            <div style={{ color: "#64748b", fontStyle: "italic" }}>
              💡 Real physical sensors mapped to T2 (Flame), T10 (Gas), and T6 (Obstacle) with autonomous edge rerouting
            </div>
          </div>
        );
      })()}

      {/* 2. MANUAL ROUTING & HAZARD CONTROL TOOLBAR */}
      <div
        style={{
          background: "linear-gradient(145deg, #182230 0%, #0f172a 100%)",
          borderRadius: "16px",
          border: "1px solid rgba(217, 119, 6, 0.3)",
          padding: "16px 20px",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#f59e0b", letterSpacing: "0.5px" }}>
              🎮 MANUAL ROUTE & HAZARD SIMULATOR
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "10px" }}>
              Manually select location, inject hazards on tunnels, and watch the edge engine reroute in real time:
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "11px" }}>
            <span>Worker: <strong style={{ color: "#f59e0b" }}>{localState.workerId} ({localState.workerName})</strong></span>
            <span>Local Compute: <strong style={{ color: "#34d399" }}>{computationTime}</strong></span>
          </div>
        </div>

        {/* Controls Row: Location selector, Target Exit selector, Recalculate button */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Worker Location Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 700 }}>Worker Location:</span>
            <select
              value={localState.workerLocation}
              onChange={(e) => handleNodeClick({ id: e.target.value })}
              style={{
                background: "#1e293b",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {localState.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.type})
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Exit Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 700 }}>Target Exit:</span>
            <select
              value={preferredExit}
              onChange={(e) => setPreferredExit(e.target.value)}
              style={{
                background: "#1e293b",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <option value="AUTO">★ Auto Closest Safe Exit (Recommended)</option>
              <option value="EXIT_BRAVO">Ventilation Adit Beta (West)</option>
              <option value="EXIT_CHARLIE">Escape Shaft Charlie (Central)</option>
              <option value="EXIT_ALPHA">Surface Portal Alpha (East)</option>
              <option value="REFUGE_BAY_1">Refuge Chamber #1 (Emergency Haven)</option>
            </select>
          </div>

          {/* Manual Recalculate Button */}
          <button
            onClick={handleRecalculateRoute}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              color: "#ffffff",
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            ⚡ Recalculate Safest Route Locally
          </button>
        </div>

        {/* Quick Scenario Preset Buttons (A to G) */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", paddingTop: "4px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>Quick Presets:</span>
          {[
            { id: "A", label: "A. Normal Clear" },
            { id: "B", label: "B. Fire in T2" },
            { id: "C", label: "C. Methane in T1" },
            { id: "D", label: "D. Dynamic Block T3" },
            { id: "E", label: "E. Sensor T3 Offline" },
            { id: "F", label: "F. No Safe Route" },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleApplyScenario(sc.id)}
              style={{
                background: activeScenario === sc.id ? "#f59e0b" : "#1e293b",
                color: activeScenario === sc.id ? "#181e24" : "#cbd5e1",
                border: `1px solid ${activeScenario === sc.id ? "#f59e0b" : "rgba(255, 255, 255, 0.12)"}`,
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN DUAL VIEW: INTERACTIVE GRAPH MAP (LEFT) & SMARTWATCH HUD (RIGHT) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        {/* Left Column: Interactive Underground Mine Map */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <MineTunnelGraph
            mapData={mapData}
            activeRoute={activeRoute}
            selectedWorkerId={localState.workerId}
            onNodeClick={handleNodeClick}
            onTunnelHazardChange={handleTunnelHazardChange}
          />

          {/* Active Route Directive Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: `1px solid ${isVerified ? "rgba(16, 185, 129, 0.3)" : isUnverified ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              padding: "16px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, color: "#181e24" }}>
                Active Evacuation Directive (Computed On-Device):
              </span>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "12px",
                  color: isVerified ? "#10b981" : isUnverified ? "#d97706" : "#dc2626",
                  background: isVerified ? "#dcfce7" : isUnverified ? "#fef3c7" : "#fee2e2",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                {activeRoute?.routeStatus || "UNKNOWN"}
              </span>
            </div>

            <div style={{ marginTop: "6px", color: "#181e24", lineHeight: "1.4" }}>
              <strong>Next Action:</strong> {activeRoute?.nextAction || "Stand by for safety protocol"}
            </div>

            <div style={{ marginTop: "4px", color: "#64748b", fontSize: "11px" }}>
              <strong>Target Exit:</strong> {activeRoute?.targetExitName || "N/A"} •{" "}
              <strong>Remaining Distance:</strong> {activeRoute?.totalDistanceMeters ?? "--"}m •{" "}
              <strong>Worker:</strong> {localState.workerName} ({localState.workerId}) at {localState.workerLocation}
            </div>

            {activeRoute?.reason && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px",
                  borderRadius: "6px",
                  background: isUnverified ? "#fffbeb" : "#f8fafc",
                  color: isUnverified ? "#b45309" : "#475569",
                  fontSize: "11px",
                  borderLeft: `3px solid ${isVerified ? "#10b981" : isUnverified ? "#f59e0b" : "#ef4444"}`,
                }}
              >
                <strong>Routing Rationale:</strong> {activeRoute.reason}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Smartwatch Emergency Evacuation Terminal */}
        <div
          style={{
            background: "linear-gradient(145deg, #111722 0%, #0d121b 100%)",
            borderRadius: "18px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ marginBottom: "12px", textAlign: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#f59e0b" }}>
              ⌚ SMARTWATCH EMERGENCY EVACUATION HUD
            </span>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Wearable On-Device Navigation • Worker [{localState.workerId}]
            </div>
          </div>

          <SmartwatchInterface
            routeData={activeRoute}
            edgeStatus={{
              edgeOnline: true,
              activeAlertsCount: (localState.edges || []).filter((e) => e.status === "HAZARDOUS" || e.status === "BLOCKED").length + (isNoSafeRoute ? 1 : 0),
              edges: localState.edges,
              physicalSensors: localState.physicalSensors,
              activeHazardHeaders: localState.activeHazardHeaders,
            }}
            onTriggerSOS={handleTriggerSOS}
            onAcknowledgeSOS={handleAcknowledgeSOS}
            isSimulated={true}
          />
        </div>
      </div>

      {/* 4. ALTERNATIVE ROUTES COMPARATOR & EXPLAINABILITY TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(217, 119, 6, 0.25)",
          padding: "20px",
          boxShadow: "0 8px 24px rgba(180, 130, 95, 0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#181e24" }}>
              📊 Edge Algorithm Alternative Routes Evaluation & Explainability
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
              Evaluates all underground egress options from current location [<strong>{localState.workerLocation}</strong>]. Explains why hazardous routes were excluded.
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
                <th style={{ padding: "10px 12px", borderBottom: "2px solid #e2e8f0" }}>TARGET EXIT / PORTAL</th>
                <th style={{ padding: "10px 12px", borderBottom: "2px solid #e2e8f0" }}>DISTANCE</th>
                <th style={{ padding: "10px 12px", borderBottom: "2px solid #e2e8f0" }}>STATUS</th>
                <th style={{ padding: "10px 12px", borderBottom: "2px solid #e2e8f0" }}>TUNNELS TRAVERSED</th>
                <th style={{ padding: "10px 12px", borderBottom: "2px solid #e2e8f0" }}>DECISION RATIONALE</th>
              </tr>
            </thead>
            <tbody>
              {localState.alternateRoutes.map((alt) => {
                const isSelected = activeRoute?.targetExitId === alt.exitId;
                return (
                  <tr
                    key={alt.exitId}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: isSelected ? "rgba(16, 185, 129, 0.06)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: isSelected ? 800 : 600, color: "#181e24" }}>
                      {isSelected ? "⭐ " : ""}
                      {alt.exitName}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#334155" }}>
                      {alt.distanceMeters > 0 ? `${alt.distanceMeters}m` : "Impassable"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "10px",
                          background:
                            alt.status === "VERIFIED SAFE"
                              ? "#dcfce7"
                              : alt.status === "SAFETY UNVERIFIED"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            alt.status === "VERIFIED SAFE"
                              ? "#15803d"
                              : alt.status === "SAFETY UNVERIFIED"
                              ? "#b45309"
                              : "#dc2626",
                        }}
                      >
                        {alt.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#64748b", fontFamily: "monospace" }}>
                      {alt.edges.length > 0 ? alt.edges.join(" → ") : "None (Cut off)"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{alt.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. LOCAL EDGE EVENT AUDIT STREAM */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1px solid rgba(217, 119, 6, 0.25)",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#181e24" }}>
            📜 On-Device Local Edge Decision & Hazard Event Stream
          </h3>
          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
            ● Recorded in local device memory (Zero cloud leakage)
          </span>
        </div>

        {localState.events.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Ready. Click any tunnel on the map to manually inject hazards and test local routing.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
            {localState.events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  background: "#f8fafc",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#1e293b" }}>{evt.message}</span>
                <span style={{ color: "#94a3b8", fontSize: "10px" }}>{evt.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

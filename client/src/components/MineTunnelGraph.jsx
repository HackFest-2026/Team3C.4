import React, { useState } from "react";

/**
 * MINEGUARD UNDERGROUND MINE DIGITAL GRAPH MAP
 * Dynamic 2D Topological Map of Subterranean Tunnels, Junctions & Portals
 *
 * Fully Interactive:
 * - Click any Tunnel (T1–T10) to manually inject or clear hazards (Fire, Gas, Blockage, Offline)
 * - Click any Node to move the worker or test evacuation routes from that point
 * - Visualizes real-time status with animated path highlights and hazard markers
 */
export default function MineTunnelGraph({
  mapData,
  activeRoute,
  selectedWorkerId = "W-104",
  onNodeClick,
  onTunnelHazardChange,
}) {
  const [selectedTunnel, setSelectedTunnel] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!mapData || !mapData.nodes || !mapData.edges) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        Loading underground mine topological graph...
      </div>
    );
  }

  const { nodes, edges, viewBox } = mapData;
  const vbWidth = viewBox?.width || 1000;
  const vbHeight = viewBox?.height || 600;

  // Set of edge IDs that belong to the active evacuation route
  const routeEdgesSet = new Set(activeRoute?.pathEdges || []);
  const routeNodesSet = new Set(activeRoute?.pathNodes || []);

  // Map nodes by ID for fast coordinate lookup
  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // If a tunnel is selected, retrieve its current live state from edges
  const activeSelectedEdge = selectedTunnel
    ? edges.find((e) => e.id === selectedTunnel.id) || selectedTunnel
    : null;

  React.useEffect(() => {
    if (!edges) return;
    edges.forEach((edge) => {
      if (edge.id === "T2" || edge.id === "TUNNEL-2") {
        console.log(`[GRAPH] Updating tunnel: TUNNEL-2 (${edge.status}${edge.flameDetected ? " - FIRE DETECTED" : ""})`);
      } else if (edge.id === "T10" || edge.id === "TUNNEL-10") {
        console.log(`[GRAPH] Updating tunnel: TUNNEL-10 (${edge.status}${edge.gasPpm ? ` - ${edge.gasPpm} PPM` : ""})`);
      } else if (edge.id === "T6" || edge.id === "TUNNEL-6") {
        console.log(`[GRAPH] Updating tunnel: TUNNEL-6 (${edge.status}${edge.distanceCm ? ` - ${edge.distanceCm} cm` : ""})`);
      }
    });
  }, [edges]);

  const getNodeColor = (node) => {
    if (node.isExit) return "#10b981"; // Bright Green for Surface Portals
    if (node.isRefuge) return "#06b6d4"; // Cyan for Safe Refuge Chamber
    if (node.type === "SHAFT") return "#eab308"; // Amber for Main Shaft
    if (node.type === "WORK_FACE") return "#f97316"; // Orange for Mining Faces
    return "#64748b"; // Slate for general junctions
  };

  const getEdgeColor = (edge) => {
    if (edge.status === "HAZARDOUS" || edge.flameDetected || edge.gasPpm >= 320 || edge.hazardType === "FIRE" || edge.hazardType === "TOXIC_GAS") {
      return "#ef4444"; // Red for Fire / Toxic Gas
    }
    if (edge.status === "BLOCKED" || (edge.distanceCm < 25.0 && edge.distanceCm > 0) || edge.hazardType === "OBSTRUCTION" || edge.hazardType === "OBJECT") {
      return "#dc2626"; // Crimson for Obstruction / Rockfall
    }
    if (edge.status === "CAUTION" || edge.gasPpm >= 180 || edge.hazardType === "GAS_WARNING") {
      return "#f59e0b"; // Amber for Caution
    }
    if (edge.status === "UNKNOWN" || edge.status === "OFFLINE" || !edge.sensorActive) {
      return "#64748b"; // Muted Slate for Offline / Unmonitored
    }
    return "#10b981"; // Green for Safe
  };

  const handleTunnelClick = (edge) => {
    setSelectedTunnel(edge);
  };

  const handleApplyHazard = (hazardType) => {
    if (!activeSelectedEdge || !onTunnelHazardChange) return;
    onTunnelHazardChange(activeSelectedEdge.id, hazardType);
  };

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0b0f15 0%, #111822 100%)",
        borderRadius: "18px",
        border: "1px solid rgba(217, 119, 6, 0.25)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        color: "#f8fafc",
      }}
    >
      {/* Map Header & Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "10px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#f59e0b" }}>
              🗺️ ACDS Gold Mines — Sector 4 Underground Topological Network
            </h3>
            <span
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid #10b981",
                color: "#34d399",
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              INTERACTIVE EDGE MAP
            </span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>
            Click any <strong>Tunnel (T1–T10)</strong> to manually simulate/clear hazards. Click any{" "}
            <strong>Node</strong> to relocate worker.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "10px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "2px" }} /> Safe
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", background: "#f59e0b", borderRadius: "2px" }} /> Caution
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", background: "#ef4444", borderRadius: "2px" }} /> Fire / Gas
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", background: "#dc2626", borderRadius: "2px" }} /> Blocked
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", background: "#64748b", borderRadius: "2px" }} /> Offline
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "12px", height: "4px", background: "#38bdf8", borderRadius: "2px" }} /> Evacuation Path
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#38bdf8",
              fontWeight: 800,
              background: "rgba(56, 189, 248, 0.12)",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
            }}
          >
            📡 IoT Sensors: T2 (Flame) • T6 (Obstacle) • T10 (Gas)
          </span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          background: "#080c12",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          position: "relative",
        }}
      >
        <svg
          viewBox={`0 0 ${vbWidth} ${vbHeight}`}
          style={{ width: "100%", height: "auto", minHeight: "360px", display: "block" }}
        >
          <defs>
            {/* Glow Filters */}
            <filter id="mgSafeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="mgHazardGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Evacuation Route Flow Animation */}
            <style>{`
              @keyframes mgRouteFlow {
                from { stroke-dashoffset: 40; }
                to { stroke-dashoffset: 0; }
              }
              .mg-active-route-flow {
                animation: mgRouteFlow 1.5s linear infinite;
              }
            `}</style>
          </defs>

          {/* Grid background reference lines */}
          <g opacity="0.06">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 60} x2={vbWidth} y2={i * 60} stroke="#ffffff" strokeWidth="1" />
            ))}
            {Array.from({ length: 17 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 60} y1="0" x2={i * 60} y2={vbHeight} stroke="#ffffff" strokeWidth="1" />
            ))}
          </g>

          {/* LAYER 1: BASE TUNNEL EDGES */}
          {edges.map((edge) => {
            const u = nodeMap.get(edge.from);
            const v = nodeMap.get(edge.to);
            if (!u || !v) return null;

            const isRouteEdge = routeEdgesSet.has(edge.id);
            const edgeColor = getEdgeColor(edge);
            const isHovered = hoveredEdge?.id === edge.id;
            const isSelected = activeSelectedEdge?.id === edge.id;
            const isDashed = edge.status === "UNKNOWN" || !edge.sensorActive;

            const midX = (u.x + v.x) / 2;
            const midY = (u.y + v.y) / 2;

            // Physical IoT Sensor Tag
            const isIotTunnel = edge.id === "T2" || edge.id === "T6" || edge.id === "T10";
            const iotSensorLabel =
              edge.id === "T2" ? "🔥 FLAME" : edge.id === "T6" ? "📡 OBSTACLE" : edge.id === "T10" ? "💨 GAS" : null;

            return (
              <g
                key={edge.id}
                onClick={() => handleTunnelClick(edge)}
                onMouseEnter={() => setHoveredEdge(edge)}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Thick tunnel casing */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={isSelected ? "#f59e0b" : "#1e293b"}
                  strokeWidth={isSelected ? 16 : isHovered ? 14 : 10}
                  strokeLinecap="round"
                />

                {/* Status core line */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={edgeColor}
                  strokeWidth={isHovered ? 6 : 4}
                  strokeDasharray={isDashed ? "8 6" : "none"}
                  strokeLinecap="round"
                  filter={edge.status === "HAZARDOUS" ? "url(#mgHazardGlow)" : undefined}
                />

                {/* Tunnel Label Pill */}
                <rect
                  x={midX - (isIotTunnel ? 32 : 22)}
                  y={midY - 11}
                  width={isIotTunnel ? 64 : 44}
                  height="22"
                  rx="5"
                  fill={isSelected ? "#f59e0b" : "#0f172a"}
                  stroke={isSelected ? "#ffffff" : isIotTunnel ? "#38bdf8" : edgeColor}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={isSelected ? 1 : 0.9}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill={isSelected ? "#181e24" : isIotTunnel ? "#38bdf8" : "#f8fafc"}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {edge.id} {isIotTunnel ? "●" : ""}
                </text>

                {/* Hazard Warning Icon Overlay */}
                {(edge.flameDetected || (edge.status === "HAZARDOUS" && edge.hazardType === "FIRE")) && (
                  <g>
                    <circle cx={midX + 28} cy={midY} r="11" fill="#dc2626" stroke="#fecaca" strokeWidth="1.5" />
                    <text x={midX + 28} y={midY + 4} fontSize="13" textAnchor="middle">
                      🔥
                    </text>
                  </g>
                )}
                {((edge.gasPpm >= 180) || edge.hazardType === "TOXIC_GAS" || edge.hazardType === "GAS" || edge.hazardType === "GAS_WARNING") && !edge.flameDetected && (
                  <g>
                    <circle cx={midX + 28} cy={midY} r="11" fill={edge.gasPpm >= 320 || edge.hazardType === "TOXIC_GAS" ? "#ef4444" : "#f59e0b"} stroke="#fef08a" strokeWidth="1.5" />
                    <text x={midX + 28} y={midY + 4} fontSize="12" textAnchor="middle">
                      💨
                    </text>
                  </g>
                )}
                {(edge.status === "BLOCKED" || (edge.distanceCm < 25.0 && edge.distanceCm >= 1.0) || edge.hazardType === "OBSTRUCTION" || edge.hazardType === "OBJECT") && (
                  <g>
                    <circle cx={midX + 28} cy={midY} r="11" fill="#dc2626" stroke="#fecaca" strokeWidth="1.5" />
                    <text x={midX + 28} y={midY + 4} fontSize="12" textAnchor="middle">
                      ⛔
                    </text>
                  </g>
                )}
                {(edge.status === "UNKNOWN" || edge.status === "OFFLINE" || !edge.sensorActive) && (
                  <g>
                    <circle cx={midX + 28} cy={midY} r="10" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                    <text x={midX + 28} y={midY + 4} fontSize="10" textAnchor="middle">
                      ⚪
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* LAYER 2: ACTIVE SAFE EVACUATION ROUTE HIGHLIGHT */}
          {edges.map((edge) => {
            if (!routeEdgesSet.has(edge.id)) return null;
            const u = nodeMap.get(edge.from);
            const v = nodeMap.get(edge.to);
            if (!u || !v) return null;

            return (
              <line
                key={`route-glow-${edge.id}`}
                x1={u.x}
                y1={u.y}
                x2={v.x}
                y2={v.y}
                stroke="#38bdf8"
                strokeWidth="6"
                strokeDasharray="10 8"
                className="mg-active-route-flow"
                strokeLinecap="round"
                opacity="0.9"
                filter="url(#mgSafeGlow)"
                pointerEvents="none"
              />
            );
          })}

          {/* LAYER 3: MINE NODES & JUNCTIONS */}
          {nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const isRouteNode = routeNodesSet.has(node.id);
            const color = getNodeColor(node);
            const isWorkerHere = (node.workers || []).some((w) => w.workerId === selectedWorkerId);

            return (
              <g
                key={node.id}
                onClick={() => onNodeClick && onNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Node Outer Halo for Exits / Mustering Points */}
                {node.isExit && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? 26 : 22}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    opacity="0.8"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.isExit ? 16 : node.isRefuge ? 14 : isHovered ? 12 : 9}
                  fill="#0f172a"
                  stroke={isRouteNode ? "#38bdf8" : color}
                  strokeWidth={isRouteNode ? 3.5 : 2.5}
                />

                {/* Node Center Icon / Indicator */}
                {node.isExit ? (
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="12" fill="#10b981">
                    🚪
                  </text>
                ) : node.isRefuge ? (
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="11" fill="#06b6d4">
                    🛡️
                  </text>
                ) : null}

                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y + (node.y > 300 ? 24 : -16)}
                  textAnchor="middle"
                  fill={isHovered ? "#f59e0b" : "#f1f5f9"}
                  fontSize={node.isExit ? 11 : 10}
                  fontWeight={node.isExit || isRouteNode ? 800 : 600}
                >
                  {node.name}
                </text>

                {/* WORKER REAL-TIME PIN ICON */}
                {isWorkerHere && (
                  <g transform={`translate(${node.x - 12}, ${node.y - 36})`}>
                    <rect x="0" y="0" width="24" height="24" rx="12" fill="#f59e0b" />
                    <text x="12" y="16" textAnchor="middle" fontSize="12">
                      👷
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. MANUAL TUNNEL HAZARD CONTROLLER (INTERACTIVE TOOLBAR) */}
      {activeSelectedEdge && (
        <div
          style={{
            background: "linear-gradient(145deg, #182230 0%, #0f172a 100%)",
            borderRadius: "14px",
            border: "1px solid rgba(217, 119, 6, 0.4)",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#f59e0b" }}>
                ⚙️ MANUAL HAZARD CONTROL: [{activeSelectedEdge.id}] {activeSelectedEdge.name}
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "10px" }}>
                ({activeSelectedEdge.lengthMeters}m • Connects {activeSelectedEdge.from} ↔ {activeSelectedEdge.to})
              </span>
            </div>

            {/* Physical IoT Sensor Indication */}
            {activeSelectedEdge.id === "T2" && (
              <span style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.3)", fontWeight: 700 }}>
                📡 Hardware Node: ESP32-MINE-NODE-01 • IR Flame Sensor
              </span>
            )}
            {activeSelectedEdge.id === "T10" && (
              <span style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.3)", fontWeight: 700 }}>
                📡 Hardware Node: ESP32-MINE-NODE-01 • MQ-135 Gas Sensor
              </span>
            )}
            {activeSelectedEdge.id === "T6" && (
              <span style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.3)", fontWeight: 700 }}>
                📡 Hardware Node: ESP32-MINE-NODE-01 • HC-SR04 Obstacle Sensor
              </span>
            )}

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: getEdgeColor(activeSelectedEdge),
                  background: "rgba(0,0,0,0.3)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: `1px solid ${getEdgeColor(activeSelectedEdge)}`,
                }}
              >
                Current: {activeSelectedEdge.status} {activeSelectedEdge.hazardType ? `(${activeSelectedEdge.hazardType})` : ""}
              </span>
              <button
                onClick={() => setSelectedTunnel(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 700 }}>Inject Condition:</span>

            <button
              onClick={() => handleApplyHazard("SAFE")}
              style={{
                background: activeSelectedEdge.status === "SAFE" ? "#10b981" : "#1e293b",
                color: activeSelectedEdge.status === "SAFE" ? "#0f172a" : "#34d399",
                border: "1px solid #10b981",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ✓ Mark Clear (Safe)
            </button>

            <button
              onClick={() => handleApplyHazard("FIRE")}
              style={{
                background: activeSelectedEdge.hazardType === "FIRE" ? "#ef4444" : "#1e293b",
                color: activeSelectedEdge.hazardType === "FIRE" ? "#ffffff" : "#fca5a5",
                border: "1px solid #ef4444",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🔥 Inject Fire Hazard
            </button>

            <button
              onClick={() => handleApplyHazard("GAS")}
              style={{
                background: activeSelectedEdge.hazardType === "TOXIC_GAS" ? "#f97316" : "#1e293b",
                color: activeSelectedEdge.hazardType === "TOXIC_GAS" ? "#ffffff" : "#fdba74",
                border: "1px solid #f97316",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              💨 Critical Gas (450 PPM)
            </button>

            <button
              onClick={() => handleApplyHazard("BLOCKED")}
              style={{
                background: activeSelectedEdge.status === "BLOCKED" ? "#dc2626" : "#1e293b",
                color: activeSelectedEdge.status === "BLOCKED" ? "#ffffff" : "#fca5a5",
                border: "1px solid #dc2626",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ⛔ Rockfall Blockage (&lt;25cm)
            </button>

            <button
              onClick={() => handleApplyHazard("OFFLINE")}
              style={{
                background: activeSelectedEdge.status === "UNKNOWN" ? "#64748b" : "#1e293b",
                color: activeSelectedEdge.status === "UNKNOWN" ? "#ffffff" : "#cbd5e1",
                border: "1px solid #64748b",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ⚪ Sensor Offline (Unknown)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

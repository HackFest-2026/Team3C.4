import React, { useState, useEffect } from "react";

/**
 * MINEGUARD SMARTWATCH EMERGENCY INTERFACE
 * Subterranean Miner Wearable HUD Preview & Emergency Evacuation Terminal
 *
 * Designed in MineGuard dark industrial mining-safety theme:
 * AMOLED high-contrast, hazard-reactive color pulsing, turn-by-turn routing,
 * route change banner, and SOS panic button.
 */
export default function SmartwatchInterface({
  routeData,
  edgeStatus,
  onTriggerSOS,
  onAcknowledgeSOS,
  isSimulated = true,
  onScenarioSelect,
}) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [prevRouteId, setPrevRouteId] = useState(null);
  const [showRouteChangeBanner, setShowRouteChangeBanner] = useState(false);
  const [viewTab, setViewTab] = useState("nav"); // "nav" | "steps" | "hazard" | "sos"

  // Live digital watch tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect dynamic route changes to flash the prominent warning
  useEffect(() => {
    if (!routeData) return;
    const currentSignature = `${routeData.routeStatus}-${routeData.targetExitId}-${(routeData.pathEdges || []).join(",")}`;

    if (prevRouteId && prevRouteId !== currentSignature) {
      setShowRouteChangeBanner(true);
      const bannerTimer = setTimeout(() => {
        setShowRouteChangeBanner(false);
      }, 7000);
      return () => clearTimeout(bannerTimer);
    }
    setPrevRouteId(currentSignature);
  }, [routeData, prevRouteId]);

  const isNoSafeRoute = Boolean(
    !routeData?.success ||
    routeData?.routeStatus?.includes("NO VERIFIED SAFE ROUTE") ||
    routeData?.routeStatus?.includes("NO SAFE ROUTE")
  );
  const routeStatus = isNoSafeRoute
    ? "NO SAFE ROUTE AVAILABLE — STOP AND FOLLOW EMERGENCY PROTOCOL"
    : (routeData?.routeStatus || "UNKNOWN");
  const isVerifiedSafe = routeStatus === "VERIFIED SAFE";
  const isUnverified = routeStatus === "SAFETY UNVERIFIED";
  const isAtExit = routeStatus === "AT SAFE EXIT";

  // Derive active emergency hazard headers
  const activeHazardHeaders = [];
  const edgeT2 = edgeStatus?.edges?.find?.((e) => e.id === "T2");
  const edgeT10 = edgeStatus?.edges?.find?.((e) => e.id === "T10");
  const edgeT6 = edgeStatus?.edges?.find?.((e) => e.id === "T6");

  // 1. Tunnel T2 Fire
  if (
    edgeStatus?.physicalSensors?.flame?.active ||
    edgeStatus?.physicalSensors?.flameT2?.active ||
    (edgeT2 && edgeT2.status === "HAZARDOUS" && edgeT2.hazardType === "FIRE") ||
    edgeT2?.flameDetected
  ) {
    activeHazardHeaders.push({ text: "🔥 FIRE DETECTED — TUNNEL T2", bg: "linear-gradient(135deg, #dc2626, #b91c1c)" });
  }

  // 2. Tunnel T2 Gas
  if (
    edgeStatus?.physicalSensors?.gasT2?.active ||
    (edgeT2 && edgeT2.status === "HAZARDOUS" && (edgeT2.hazardType === "TOXIC_GAS" || edgeT2.gasPpm >= 320))
  ) {
    activeHazardHeaders.push({ text: "💨 DANGEROUS GAS DETECTED — TUNNEL T2", bg: "linear-gradient(135deg, #ea580c, #c2410c)" });
  }

  // 3. Tunnel T10 Gas
  if (
    edgeStatus?.physicalSensors?.gas?.active ||
    edgeStatus?.physicalSensors?.gasT10?.active ||
    (edgeT10 && edgeT10.status === "HAZARDOUS" && (edgeT10.hazardType === "TOXIC_GAS" || edgeT10.gasPpm >= 320))
  ) {
    activeHazardHeaders.push({ text: "💨 DANGEROUS GAS DETECTED — TUNNEL T10", bg: "linear-gradient(135deg, #ea580c, #c2410c)" });
  }

  // 4. Tunnel T6 Obstacle
  if (
    edgeStatus?.physicalSensors?.obstacle?.active ||
    edgeStatus?.physicalSensors?.obstacleT6?.active ||
    (edgeT6 && (edgeT6.status === "BLOCKED" || edgeT6.hazardType === "OBSTRUCTION" || (edgeT6.distanceCm < 25.0 && edgeT6.distanceCm > 0)))
  ) {
    activeHazardHeaders.push({ text: "⛔ OBSTACLE DETECTED — TUNNEL T6", bg: "linear-gradient(135deg, #b91c1c, #991b1b)" });
  }

  // 5. Any other hazard tunnels
  (edgeStatus?.edges || []).forEach((e) => {
    if (e.id !== "T2" && e.id !== "T10" && e.id !== "T6") {
      if (e.status === "HAZARDOUS" && e.hazardType === "FIRE") {
        activeHazardHeaders.push({ text: `🔥 FIRE DETECTED — TUNNEL ${e.id}`, bg: "linear-gradient(135deg, #dc2626, #b91c1c)" });
      } else if (e.status === "HAZARDOUS") {
        activeHazardHeaders.push({ text: `💨 DANGEROUS GAS DETECTED — TUNNEL ${e.id}`, bg: "linear-gradient(135deg, #ea580c, #c2410c)" });
      } else if (e.status === "BLOCKED") {
        activeHazardHeaders.push({ text: `⛔ OBSTACLE DETECTED — TUNNEL ${e.id}`, bg: "linear-gradient(135deg, #b91c1c, #991b1b)" });
      }
    }
  });

  if (isNoSafeRoute) {
    activeHazardHeaders.push({ text: "🚨 NO SAFE ROUTE AVAILABLE — STOP AND FOLLOW EMERGENCY PROTOCOL", bg: "linear-gradient(135deg, #ef4444, #7f1d1d)" });
  }

  const isEmergency = isNoSafeRoute || routeData?.sosActive || activeHazardHeaders.length > 0;
  const isCaution = isUnverified || (routeData?.unverifiedSegments && routeData.unverifiedSegments.length > 0);

  // Status Theme Colors
  const statusColor = isNoSafeRoute || routeData?.sosActive
    ? "#ef4444"
    : isCaution
    ? "#f59e0b"
    : isVerifiedSafe || isAtExit
    ? "#10b981"
    : "#06b6d4";

  const nextAction = isNoSafeRoute
    ? "STOP AND FOLLOW EMERGENCY PROTOCOL"
    : (routeData?.nextAction || "PROCEED CAUTIOUSLY");
  const targetExit = routeData?.targetExitName || "SURFACE EGRESS";
  const distanceRemaining = routeData?.totalDistanceMeters ?? "--";
  const instructions = routeData?.instructions || [];
  const workerId = routeData?.workerId || "W-104";
  const workerLocation = routeData?.locationNode || "EXTRACTION FACE ALPHA";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      {/* Smartwatch Outer Bezel Frame */}
      <div
        style={{
          width: "320px",
          height: "380px",
          background: "radial-gradient(circle at 50% 30%, #202630 0%, #0d1117 80%, #05070a 100%)",
          borderRadius: "48px",
          padding: "16px",
          boxShadow: `0 14px 40px rgba(0,0,0,0.6), inset 0 0 0 4px #2a3441, 0 0 25px ${
            isEmergency ? "rgba(239, 68, 68, 0.4)" : "rgba(217, 119, 6, 0.2)"
          }`,
          border: `2px solid ${isEmergency ? "#ef4444" : "#475569"}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#f8fafc",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Dynamic Pulsing Status Border Ring */}
        <div
          style={{
            position: "absolute",
            top: "6px",
            left: "6px",
            right: "6px",
            bottom: "6px",
            borderRadius: "42px",
            border: `2px solid ${statusColor}`,
            opacity: isEmergency ? 0.9 : 0.4,
            pointerEvents: "none",
            animation: isEmergency ? "mgPulse 1.5s infinite" : "none",
          }}
        />

        {/* Watch Top Bar: Clock, Battery, Edge Link */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "4px 8px 0",
            fontSize: "10px",
            color: "#94a3b8",
            fontWeight: 700,
            letterSpacing: "0.5px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "6px",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: statusColor,
                display: "inline-block",
              }}
            />
            <span>{edgeStatus?.edgeOnline ? "EDGE LOCAL" : "LINK LOST"}</span>
          </div>

          <div style={{ fontSize: "11px", color: "#f8fafc", fontWeight: 800 }}>{currentTime}</div>

          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span>98%</span>
            <span style={{ fontSize: "11px" }}>🔋</span>
          </div>
        </div>

        {/* PROMINENT ROUTE CHANGED BANNER */}
        {showRouteChangeBanner && (
          <div
            style={{
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "#ffffff",
              padding: "6px 8px",
              borderRadius: "8px",
              margin: "4px 0",
              textAlign: "center",
              fontSize: "11px",
              fontWeight: 900,
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.6)",
              animation: "mgFlash 0.8s infinite",
              zIndex: 10,
            }}
          >
            ⚠️ ROUTE CHANGED! NEW HAZARD DETECTED
          </div>
        )}

        {/* ACTIVE HAZARD EMERGENCY HEADERS */}
        {activeHazardHeaders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", margin: "2px 0", zIndex: 10 }}>
            {activeHazardHeaders.map((hdr, idx) => (
              <div
                key={idx}
                style={{
                  background: hdr.bg,
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.5px",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                  animation: "mgFlash 1.2s infinite",
                }}
              >
                {hdr.text}
              </div>
            ))}
          </div>
        )}

        {/* Main AMOLED Screen Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 4px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 2,
          }}
        >
          {/* Worker Badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10px",
              color: "#cbd5e1",
            }}
          >
            <span>
              👷 <strong>{workerId}</strong>
            </span>
            <span style={{ color: "#94a3b8", fontSize: "9px" }}>LOC: {workerLocation}</span>
          </div>

          {/* VIEW: NAVIGATION (DEFAULT) */}
          {viewTab === "nav" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* Emergency / Route Status Badge */}
              <div
                style={{
                  background:
                    isNoSafeRoute
                      ? "rgba(239, 68, 68, 0.25)"
                      : isUnverified
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(16, 185, 129, 0.2)",
                  border: `1px solid ${statusColor}`,
                  borderRadius: "8px",
                  padding: "6px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 800 }}>
                  ROUTE STATUS
                </div>
                <div style={{ fontSize: "12px", fontWeight: 900, color: statusColor, marginTop: "1px" }}>
                  {routeStatus}
                </div>
              </div>

              {/* Next Action Box */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "9px", color: "#f59e0b", fontWeight: 800, textTransform: "uppercase" }}>
                  NEXT ACTION
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 900,
                    color: "#ffffff",
                    margin: "3px 0",
                    lineHeight: "1.25",
                  }}
                >
                  {nextAction}
                </div>
                <div style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 700 }}>
                  TO: {targetExit}
                </div>
              </div>

              {/* Remaining Distance & Turn Indicator */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    borderRadius: "8px",
                    padding: "6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "9px", color: "#94a3b8" }}>REMAINING</div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#f8fafc" }}>
                    {distanceRemaining}m
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    borderRadius: "8px",
                    padding: "6px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "9px", color: "#94a3b8" }}>COMPASS</div>
                  <div style={{ fontSize: "13px", fontWeight: 900, color: "#38bdf8" }}>
                    🧭 {isAtExit ? "SURFACE" : "EGRESS"}
                  </div>
                </div>
              </div>

              {/* Fail-safe safety reasoning note */}
              {routeData?.reason && (
                <div
                  style={{
                    fontSize: "9px",
                    color: isUnverified ? "#fbbf24" : isNoSafeRoute ? "#f87171" : "#94a3b8",
                    lineHeight: "1.3",
                    background: "rgba(0,0,0,0.3)",
                    padding: "5px 6px",
                    borderRadius: "6px",
                  }}
                >
                  ℹ️ {routeData.reason}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ORDERED STEPS */}
          {viewTab === "steps" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8" }}>
                ORDERED ROUTE STEPS ({instructions.length}):
              </div>
              {instructions.length === 0 ? (
                <div style={{ fontSize: "10px", color: "#ef4444" }}>No safe steps available.</div>
              ) : (
                instructions.map((inst, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(30, 41, 59, 0.8)",
                      padding: "5px 8px",
                      borderRadius: "6px",
                      fontSize: "9px",
                      borderLeft: `3px solid ${inst.status === "UNKNOWN" ? "#f59e0b" : "#10b981"}`,
                    }}
                  >
                    <strong>Step {inst.step}:</strong> {inst.action}
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW: SOS TRIGGER & ACK */}
          {viewTab === "sos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#ef4444" }}>
                EMERGENCY DISTRESS BEACON
              </div>
              <p style={{ fontSize: "9px", color: "#cbd5e1", margin: 0 }}>
                Press to transmit distress beacon to Mine Safety Command and sound local helmet siren.
              </p>
              {!routeData?.sosActive ? (
                <button
                  onClick={() => onTriggerSOS && onTriggerSOS(workerId)}
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                    border: "none",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "10px",
                    fontWeight: 900,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.5)",
                  }}
                >
                  🚨 TRANSMIT SOS BEACON
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid #ef4444",
                      color: "#fca5a5",
                      padding: "6px",
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    ⚡ SOS SIGNAL BROADCASTING...
                  </div>
                  <button
                    onClick={() => onAcknowledgeSOS && onAcknowledgeSOS(workerId)}
                    style={{
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid #10b981",
                      color: "#34d399",
                      padding: "6px",
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Acknowledge & Stand Down
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Watch Bottom Navigation Pill Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "4px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "6px",
            zIndex: 2,
          }}
        >
          <button
            onClick={() => setViewTab("nav")}
            style={{
              background: viewTab === "nav" ? "#334155" : "transparent",
              border: "none",
              color: viewTab === "nav" ? "#38bdf8" : "#94a3b8",
              fontSize: "9px",
              fontWeight: 700,
              padding: "4px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🧭 Route
          </button>
          <button
            onClick={() => setViewTab("steps")}
            style={{
              background: viewTab === "steps" ? "#334155" : "transparent",
              border: "none",
              color: viewTab === "steps" ? "#38bdf8" : "#94a3b8",
              fontSize: "9px",
              fontWeight: 700,
              padding: "4px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📋 Steps
          </button>
          <button
            onClick={() => setViewTab("sos")}
            style={{
              background: viewTab === "sos" ? "rgba(239, 68, 68, 0.3)" : "transparent",
              border: "none",
              color: viewTab === "sos" ? "#ef4444" : "#f87171",
              fontSize: "9px",
              fontWeight: 800,
              padding: "4px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🚨 SOS
          </button>
        </div>
      </div>

      {/* Hardware Disclaimer & Physical Wearable Integration Note */}
      <div
        style={{
          maxWidth: "340px",
          fontSize: "10px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.4",
        }}
      >
        <span style={{ color: "#d97706", fontWeight: 700 }}>
          {isSimulated ? "● Browser Wearable HUD Simulation" : "● Live Companion Wearable Link"}
        </span>
        <br />
        Physical smartwatch support (WearOS / Apple Watch / Tizen) utilizes local Bluetooth BLE beacon
        or local Wi-Fi UDP broadcast companion app.
      </div>
    </div>
  );
}

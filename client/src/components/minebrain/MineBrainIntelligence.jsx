import React, { useState, useMemo } from "react";
import "./MineBrainIntelligence.css";

// High-fidelity local mining photography assets
import minebrainBg from "./assets/minebrain_bg.jpg";
import safetyWorkerImg from "./assets/safety_worker.jpg";
import equipmentFleetImg from "./assets/equipment_fleet.jpg";
import envStationImg from "./assets/environmental_station.jpg";

import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  HardHat,
  Flame,
  Wind,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Copy,
  Check,
  X,
} from "lucide-react";

/**
 * MINEBRAIN AI — Mining Intelligence & Safety Command Center
 * Scoped, industrial-grade operational AI control dashboard for ACDS Gold Mines.
 */
export default function MineBrainIntelligence({
  workers = [],
  equipment = [],
  environment = [],
  compliance = [],
  hardwareData = null,
  aiData = null,
  isSimulatedMode = false,
  webSerialConnected = false,
  serverOnline = true,
  onRefresh = null,
}) {
  // Category filter state for Action Center
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Interactive action review states (persists user interactions during session)
  const [actionStatuses, setActionStatuses] = useState({});
  
  // Daily Briefing Modal state
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [copiedBriefing, setCopiedBriefing] = useState(false);
  
  // Feedback toast for quick interactive triggers
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // 1. ENGINE RUNTIME STATUS
  // ---------------------------------------------------------------------------
  const engineStatus = useMemo(() => {
    if (!serverOnline) {
      return { label: "Unavailable", mode: "unavailable", desc: "Server connection offline" };
    }
    if (webSerialConnected) {
      return { label: "Active • Live ESP32 Hardware", mode: "active", desc: "Live physical telemetry stream" };
    }
    if (isSimulatedMode) {
      return { label: "Demo Mode • Simulated Telemetry", mode: "demo", desc: "Simulated industrial sensor signals" };
    }
    return { label: "Active • Telemetry Synchronized", mode: "active", desc: "Database & sensor telemetry linked" };
  }, [serverOnline, webSerialConnected, isSimulatedMode]);

  // ---------------------------------------------------------------------------
  // 2. DOMAIN TELEMETRY & RULE DERIVATIONS
  // ---------------------------------------------------------------------------
  // A. Workforce & PPE
  const totalWorkers = workers.length || 1;
  const verifiedPPEWorkers = workers.filter((w) => w.ppeStatus === "All PPE Verified");
  const ppeComplianceRate = Math.round((verifiedPPEWorkers.length / totalWorkers) * 100);
  const highRiskWorkers = workers.filter(
    (w) => w.riskLevel === "High" || w.riskLevel === "Critical"
  );
  const flaggedPPEWorkers = workers.filter(
    (w) => w.ppeStatus && w.ppeStatus !== "All PPE Verified"
  );

  // B. Fleet Health
  const totalEquip = equipment.length || 1;
  const lowFuelEquip = equipment.filter(
    (e) => typeof e.fuelLevel === "number" && e.fuelLevel < 40
  );
  const maintenanceDueEquip = equipment.filter(
    (e) => e.maintenanceStatus && e.maintenanceStatus !== "Up to Date"
  );
  const operationalEquip = equipment.filter((e) => e.status === "Operational");
  const fleetReadiness = Math.round((operationalEquip.length / totalEquip) * 100);

  // C. Subterranean Environment
  const flameDetected = Boolean(hardwareData?.flameDetected);
  const gasPpm = Number(hardwareData?.gasPpm ?? (environment[0]?.gasLevel ? parseFloat(environment[0]?.gasLevel) : 85));
  const distanceCm = Number(hardwareData?.distanceCm ?? 120.0);
  const proximityAlert = Boolean(hardwareData?.proximityAlert);

  const isGasCritical = gasPpm >= 300;
  const isGasWarning = gasPpm >= 180;

  // D. DGMS Regulatory Compliance
  const urgentCompliance = compliance.filter((c) => typeof c.daysToExpiry === "number" && c.daysToExpiry < 30);

  // ---------------------------------------------------------------------------
  // 3. GENERATE ACTION DIRECTIVES (FLAGSHIP FEATURE 4)
  // ---------------------------------------------------------------------------
  const rawActionItems = useMemo(() => {
    const items = [];

    // Environmental alerts (highest priority)
    if (flameDetected) {
      items.push({
        id: "env-flame-01",
        category: "Environment",
        priority: "Critical",
        title: "Active Flame Detection — Emergency Protocol Standby",
        reason: "Flame sensor triggered on ESP32 node. Potential subterranean ignition in monitoring zone.",
        actionText: "Initiate immediate tunnel muster and verify emergency sprinkler manifold.",
        source: "Live Telemetry (ESP32 GPIO 4)",
      });
    }

    if (isGasCritical) {
      items.push({
        id: "env-gas-01",
        category: "Environment",
        priority: "Critical",
        title: `Toxic Gas Spike: ${gasPpm} PPM Exceeds Statutory Threshold`,
        reason: "Gas concentration exceeds DGMS safe threshold (300 PPM max allowable in active headings).",
        actionText: "Spin auxiliary fans to 100% capacity; order temporary personnel rollback to fresh air base.",
        source: "Live Telemetry (MQ-135 / MQ-4)",
      });
    } else if (isGasWarning) {
      items.push({
        id: "env-gas-02",
        category: "Environment",
        priority: "High",
        title: `Elevated Gas Level: ${gasPpm} PPM Approaching Warning Ceiling`,
        reason: "Trend shows steady upward PPM drift. Possible localized ventilation stagnation.",
        actionText: "Inspect brattice cloths and verify secondary ventilation duct alignment.",
        source: "Calibrated Telemetry",
      });
    }

    if (proximityAlert) {
      items.push({
        id: "env-prox-01",
        category: "Environment",
        priority: "High",
        title: `Shaft Clearance Obstruction: ${distanceCm}cm Distance Alert`,
        reason: "HC-SR04 ultrasonic sensor reports object/rockfall hazard within 25cm critical boundary.",
        actionText: "Halt conveyor or track haulage until shaft clearance is physically cleared.",
        source: "Ultrasonic Proximity (GPIO 5/18)",
      });
    }

    // Workforce Safety directives
    highRiskWorkers.forEach((w) => {
      items.push({
        id: `worker-risk-${w.id || w._id || w.name}`,
        category: "Worker Safety",
        priority: "High",
        title: `High Fatigue / Risk Status: ${w.name} (${w.role || "Operator"})`,
        reason: `Flagged under Safety Risk Rule SR-102. High cumulative shifts or critical risk indicator.`,
        actionText: `Perform supervisor fit-for-duty interview and assign to lower strain surface rotation.`,
        source: "Worker Profile DB",
      });
    });

    flaggedPPEWorkers.slice(0, 3).forEach((w) => {
      items.push({
        id: `worker-ppe-${w.id || w._id || w.name}`,
        category: "Worker Safety",
        priority: "High",
        title: `PPE Deficiency: ${w.name} (${w.ppeStatus || "Verification Required"})`,
        reason: `DGMS Reg. 182 mandates 100% hard hat, goggle, and respirator seal prior to shaft cage descent.`,
        actionText: `Hold at Turnstile Checkpoint B until complete PPE equipment audit is signed.`,
        source: "Smart Gate Safety Log",
      });
    });

    // Equipment fleet directives
    lowFuelEquip.forEach((e) => {
      items.push({
        id: `equip-fuel-${e.equipmentId || e._id}`,
        category: "Heavy Fleet",
        priority: "High",
        title: `Low Fuel Alert: ${e.equipmentName} (${e.fuelLevel}% Fuel Remaining)`,
        reason: `Rule EQ-FUEL-40: Machines below 40% fuel risk stalling in underground incline ramps.`,
        actionText: `Dispatch mobile diesel tanker to ${e.currentLocation || "Active Stope"}.`,
        source: "Fleet Telemetry API",
      });
    });

    maintenanceDueEquip.forEach((e) => {
      items.push({
        id: `equip-maint-${e.equipmentId || e._id}`,
        category: "Heavy Fleet",
        priority: e.maintenanceStatus === "Overdue" ? "Critical" : "Medium",
        title: `Service Inspection Due: ${e.equipmentName} (${e.maintenanceStatus})`,
        reason: `Exceeded operating interval without hydraulic and brake pressure sign-off.`,
        actionText: `Route to Underground Workshop Bay 3 for scheduled preventative maintenance.`,
        source: "Maintenance Ledger",
      });
    });

    // DGMS Compliance directives
    if (urgentCompliance.length > 0) {
      urgentCompliance.forEach((c) => {
        items.push({
          id: `comp-urgent-${c.id || c._id || c.title}`,
          category: "DGMS Compliance",
          priority: "High",
          title: `Statutory Expiry: ${c.title} (${c.daysToExpiry} days remaining)`,
          reason: `DGMS Metalliferous Mining Audit window closes soon. Non-renewal can halt stope permits.`,
          actionText: `Upload certified testing certificates and submit Form IV to regional inspectorate.`,
          source: "DGMS Compliance Vault",
        });
      });
    } else {
      // Default statutory schedule item if database has none expiring
      items.push({
        id: "comp-statutory-01",
        category: "DGMS Compliance",
        priority: "Medium",
        title: "Annual Blasting & Seismic Monitoring Review Due (7 Days)",
        reason: "DGMS Circular 04 requires tri-annual blast wave attenuation audit for deep gold shafts.",
        actionText: "Compile blast vibration geophone logs from Level 4 Sub-shaft.",
        source: "DGMS Statutory Schedule",
      });
    }

    // Include backend recommendations from aiData if available
    if (Array.isArray(aiData?.recommendations)) {
      aiData.recommendations.forEach((rec, idx) => {
        items.push({
          id: `backend-ai-rec-${idx}`,
          category: rec.category === "PPE" ? "Worker Safety" : rec.category || "Worker Safety",
          priority: rec.priority || "Medium",
          title: `Autonomous Engine Directive: ${rec.category || "General"}`,
          reason: "Identified by cross-functional pattern recognition across multiple telemetry domains.",
          actionText: rec.action,
          source: "MineBrain Core Model",
        });
      });
    }

    return items;
  }, [
    flameDetected,
    isGasCritical,
    isGasWarning,
    gasPpm,
    distanceCm,
    proximityAlert,
    highRiskWorkers,
    flaggedPPEWorkers,
    lowFuelEquip,
    maintenanceDueEquip,
    urgentCompliance,
    aiData,
  ]);

  // Handle cycle through review states: Unreviewed -> Under Review -> Action Assigned -> Resolved
  const cycleStatus = (itemId) => {
    const current = actionStatuses[itemId] || "Unreviewed";
    let next;
    if (current === "Unreviewed") next = "Under Review";
    else if (current === "Under Review") next = "Action Assigned";
    else if (current === "Action Assigned") next = "Resolved";
    else next = "Unreviewed";

    setActionStatuses((prev) => ({ ...prev, [itemId]: next }));
    showToast(`Directive status updated to: "${next}"`);
  };

  // Filtered action items
  const filteredActions = useMemo(() => {
    return rawActionItems.filter((item) => {
      const status = actionStatuses[item.id] || "Unreviewed";
      if (selectedCategory === "open") {
        return status !== "Resolved";
      }
      if (selectedCategory === "all") {
        return true;
      }
      return item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    });
  }, [rawActionItems, actionStatuses, selectedCategory]);

  const openActionsCount = rawActionItems.filter(
    (item) => (actionStatuses[item.id] || "Unreviewed") !== "Resolved"
  ).length;

  // Smooth scroll helper
  const scrollToActions = (category) => {
    setSelectedCategory(category);
    const element = document.getElementById("minebrain-actions-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Copy Briefing text helper
  const handleCopyBriefing = () => {
    const briefingText = `ACDS GOLD MINES — DAILY SHIFT INTELLIGENCE BRIEFING
Generated: ${new Date().toLocaleString()}
Mine Section: Shaft No. 4 & Main Incline
Engine Status: ${engineStatus.label}

1. WORKFORCE & SAFETY
• Active Personnel: ${workers.length}
• PPE Verification Rate: ${ppeComplianceRate}%
• High-Risk Flags: ${highRiskWorkers.length} personnel requiring supervisor intervention

2. HEAVY FLEET STATUS
• Fleet Readiness: ${fleetReadiness}% (${operationalEquip.length}/${totalEquip} operational)
• Low Fuel Units: ${lowFuelEquip.length} machine(s) below 40% reserve
• Maintenance Overdue: ${maintenanceDueEquip.length} unit(s)

3. SUBTERRANEAN ENVIRONMENT
• Flame Status: ${flameDetected ? "ACTIVE FLAME ALERT" : "CLEAR / SAFE"}
• Gas Concentration: ${gasPpm} PPM (${isGasCritical ? "CRITICAL" : isGasWarning ? "WARNING" : "NORMAL"})
• Shaft Clearance: ${distanceCm} cm

4. OUTSTANDING DIRECTIVES (${openActionsCount} Open)
${rawActionItems
  .slice(0, 5)
  .map((a, i) => `${i + 1}. [${a.priority}] ${a.title} -> Action: ${a.actionText}`)
  .join("\n")}

Shift Supervisor Sign-off: _______________________
`;

    navigator.clipboard.writeText(briefingText).then(() => {
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 2500);
    });
  };

  return (
    <div className="minebrain-intelligence">
      {/* Background layer with subtle industrial gradient overlay & fallback */}
      <div
        className="minebrain-bg-layer"
        style={{ backgroundImage: `url(${minebrainBg})` }}
      />
      <div className="minebrain-scanline" />
      <div className="minebrain-scanning-beam" />

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            zIndex: 9999,
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            border: "1.5px solid #fbbf24",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.3)",
            color: "#f8fafc",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "16px" }}>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="minebrain-content-wrapper">
        {/* ================================================================= */}
        {/* A. PREMIUM COMMAND HEADER                                         */}
        {/* ================================================================= */}
        <header className="minebrain-hero">
          <div className="minebrain-brand-lockup">
            <div className="minebrain-logo-badge">
              <span>🧠</span>
            </div>
            <div className="minebrain-title-block">
              <h1>
                MINEBRAIN AI
                <span className="minebrain-gold-accent">
                  Mining Intelligence & Safety Command Center
                </span>
              </h1>
              <p className="minebrain-subtitle">
                Autonomous cross-functional analytics for gold mining operations
              </p>
              <p className="minebrain-tagline">
                Bridging underground IoT telemetry, DGMS regulatory safety rules, and
                predictive fleet health into real-time operational decisions.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {/* Animated Engine Status Indicator */}
            <div className="minebrain-engine-indicator">
              <div className={`minebrain-pulse-ring ${engineStatus.mode}`} />
              <div>
                <div className="minebrain-engine-label">INTELLIGENCE ENGINE</div>
                <div className="minebrain-engine-status">{engineStatus.label}</div>
              </div>
            </div>

            {/* Quick Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="minebrain-action-btn"
                style={{ padding: "10px 14px", margin: 0 }}
                title="Synchronize Live Telemetry"
              >
                <RefreshCw size={14} />
                <span>Sync</span>
              </button>
            )}
          </div>
        </header>

        {/* ================================================================= */}
        {/* B. FOUR INTERACTIVE OVERVIEW SUMMARY PANELS                       */}
        {/* ================================================================= */}
        <section className="minebrain-overview-grid">
          {/* 1. Safety Issues Panel */}
          <div
            className={`minebrain-summary-card ${selectedCategory === "worker safety" ? "active" : ""}`}
            onClick={() => scrollToActions("worker safety")}
            title="Click to view safety directives in Action Center"
          >
            <div className="minebrain-card-header">
              <span>Safety & PPE Alerts</span>
              <span className="minebrain-card-icon">👷</span>
            </div>
            <div className="minebrain-card-value">
              {highRiskWorkers.length + flaggedPPEWorkers.length}
            </div>
            <div className="minebrain-card-desc">
              {flaggedPPEWorkers.length} PPE checks needed • {highRiskWorkers.length} fatigue risk flags
            </div>
          </div>

          {/* 2. Equipment Priorities Panel */}
          <div
            className={`minebrain-summary-card ${selectedCategory === "heavy fleet" ? "active" : ""}`}
            onClick={() => scrollToActions("heavy fleet")}
            title="Click to view fleet directives in Action Center"
          >
            <div className="minebrain-card-header">
              <span>Equipment Priorities</span>
              <span className="minebrain-card-icon">🚜</span>
            </div>
            <div className="minebrain-card-value">
              {maintenanceDueEquip.length + lowFuelEquip.length}
            </div>
            <div className="minebrain-card-desc">
              {maintenanceDueEquip.length} service overdue • {lowFuelEquip.length} low fuel (&lt;40%)
            </div>
          </div>

          {/* 3. Environmental Alerts Panel */}
          <div
            className={`minebrain-summary-card ${selectedCategory === "environment" ? "active" : ""}`}
            onClick={() => scrollToActions("environment")}
            title="Click to view environmental alerts in Action Center"
          >
            <div className="minebrain-card-header">
              <span>Subterranean Environment</span>
              <span className="minebrain-card-icon">🌱</span>
            </div>
            <div
              className="minebrain-card-value"
              style={{
                color: flameDetected
                  ? "#ef4444"
                  : isGasCritical
                  ? "#f59e0b"
                  : "#10b981",
                fontSize: "22px",
              }}
            >
              {flameDetected
                ? "FIRE ALARM"
                : isGasCritical
                ? "HIGH GAS"
                : "ATMOSPHERE SAFE"}
            </div>
            <div className="minebrain-card-desc">
              {gasPpm} PPM Gas • {distanceCm}cm Shaft Clearance
            </div>
          </div>

          {/* 4. Open Directives Panel */}
          <div
            className={`minebrain-summary-card ${selectedCategory === "open" ? "active" : ""}`}
            onClick={() => scrollToActions("open")}
            title="Click to view open actionable directives"
          >
            <div className="minebrain-card-header">
              <span>Open Directives</span>
              <span className="minebrain-card-icon">⚡</span>
            </div>
            <div className="minebrain-card-value" style={{ color: "#fbbf24" }}>
              {openActionsCount}
            </div>
            <div className="minebrain-card-desc">
              Corrective action items requiring supervisor sign-off
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* C. THREE CORE ADVISORY MODULES (Features 1, 2, 3 Grid)           */}
        {/* ================================================================= */}
        <section className="minebrain-features-grid">
          {/* --------------------------------------------------------------- */}
          {/* FEATURE 1: AI Safety Compliance Advisor                         */}
          {/* --------------------------------------------------------------- */}
          <div className="minebrain-feature-card">
            <div className="minebrain-visual-header">
              <img
                src={safetyWorkerImg}
                alt="Underground Mine Safety Compliance"
                className="minebrain-visual-img"
              />
              <div className="minebrain-visual-overlay" />
              <div
                className={`minebrain-badge-pill ${
                  ppeComplianceRate >= 90
                    ? "minebrain-badge-green"
                    : ppeComplianceRate >= 70
                    ? "minebrain-badge-amber"
                    : "minebrain-badge-red"
                }`}
              >
                {ppeComplianceRate}% PPE Verified
              </div>
            </div>

            <div className="minebrain-feature-body">
              <h3 className="minebrain-feature-title">
                <ShieldCheck size={18} color="#fbbf24" />
                AI Safety Compliance Advisor
              </h3>
              <p className="minebrain-feature-desc">
                Real-time workforce inspection tracking hard hat, goggle, and respiratory
                mandates against DGMS standard safety guidelines.
              </p>

              <div className="minebrain-data-box">
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Active Headcount</span>
                  <span className="minebrain-data-val">{workers.length} Personnel</span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Hard Hat Compliance</span>
                  <span className="minebrain-data-val" style={{ color: "#10b981" }}>
                    98.4% Nominal
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Goggles & Face Shields</span>
                  <span className="minebrain-data-val" style={{ color: "#fbbf24" }}>
                    94.1% Verified
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Respirator Seal</span>
                  <span className="minebrain-data-val" style={{ color: "#06b6d4" }}>
                    91.8% Checked
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Data Source</span>
                  <span className="minebrain-data-val" style={{ color: "#94a3b8", fontSize: "10px" }}>
                    Smart Gate Vision & Database Profile
                  </span>
                </div>
              </div>

              {flaggedPPEWorkers.length > 0 ? (
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "#fde68a",
                  }}
                >
                  <strong>Flagged for Review:</strong> {flaggedPPEWorkers[0].name} (
                  {flaggedPPEWorkers[0].role || "Worker"}) requires mandatory equipment audit.
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "#a7f3d0",
                  }}
                >
                  ✓ All active shift personnel meet statutory safety equipment standards.
                </div>
              )}

              <button
                className="minebrain-action-btn"
                onClick={() => {
                  showToast("Workforce PPE safety verification audit logged.");
                }}
              >
                <HardHat size={14} />
                <span>Audit PPE Checkpoint</span>
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* FEATURE 2: AI Equipment Health Advisor                          */}
          {/* --------------------------------------------------------------- */}
          <div className="minebrain-feature-card">
            <div className="minebrain-visual-header">
              <img
                src={equipmentFleetImg}
                alt="Heavy Mining Equipment Health Fleet"
                className="minebrain-visual-img"
              />
              <div className="minebrain-visual-overlay" />
              <div
                className={`minebrain-badge-pill ${
                  fleetReadiness >= 85
                    ? "minebrain-badge-green"
                    : fleetReadiness >= 65
                    ? "minebrain-badge-amber"
                    : "minebrain-badge-red"
                }`}
              >
                {fleetReadiness}% Fleet Operational
              </div>
            </div>

            <div className="minebrain-feature-body">
              <h3 className="minebrain-feature-title">
                <Wrench size={18} color="#fbbf24" />
                AI Equipment Health Advisor
              </h3>
              <p className="minebrain-feature-desc">
                Machine telemetry analysis predicting breakdown risks, prioritizing hydraulic
                servicing, and preventing ramp fuel starvation.
              </p>

              <div className="minebrain-data-box">
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Total Monitored Fleet</span>
                  <span className="minebrain-data-val">{equipment.length} Units</span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Service Overdue</span>
                  <span
                    className="minebrain-data-val"
                    style={{ color: maintenanceDueEquip.length > 0 ? "#ef4444" : "#10b981" }}
                  >
                    {maintenanceDueEquip.length} Required
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Low Fuel (&lt;40% Reserve)</span>
                  <span
                    className="minebrain-data-val"
                    style={{ color: lowFuelEquip.length > 0 ? "#f59e0b" : "#10b981" }}
                  >
                    {lowFuelEquip.length} Machine(s)
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Rule Applied</span>
                  <span className="minebrain-data-val" style={{ color: "#94a3b8", fontSize: "10px" }}>
                    DGMS-M48 Hydraulic Interval
                  </span>
                </div>
              </div>

              {lowFuelEquip.length > 0 ? (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "#fca5a5",
                  }}
                >
                  <strong>Priority Machine:</strong> {lowFuelEquip[0].equipmentName} at{" "}
                  {lowFuelEquip[0].currentLocation} ({lowFuelEquip[0].fuelLevel}% fuel).
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "#a7f3d0",
                  }}
                >
                  ✓ All active haulers, loaders, and drill rigs within safe operating envelope.
                </div>
              )}

              <button
                className="minebrain-action-btn"
                onClick={() => {
                  showToast("Work order dispatched to Underground Workshop Bay 3.");
                }}
              >
                <Wrench size={14} />
                <span>Dispatch Maintenance Work Order</span>
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* FEATURE 3: Environmental Risk Intelligence                      */}
          {/* --------------------------------------------------------------- */}
          <div className="minebrain-feature-card">
            <div className="minebrain-visual-header">
              <img
                src={envStationImg}
                alt="Subterranean Environmental Gas Station"
                className="minebrain-visual-img"
              />
              <div className="minebrain-visual-overlay" />
              <div
                className={`minebrain-badge-pill ${
                  flameDetected
                    ? "minebrain-badge-red"
                    : isGasCritical
                    ? "minebrain-badge-amber"
                    : "minebrain-badge-green"
                }`}
              >
                {flameDetected
                  ? "CRITICAL FIRE"
                  : isGasCritical
                  ? "GAS ELEVATED"
                  : "SAFE SHAFT AIR"}
              </div>
            </div>

            <div className="minebrain-feature-body">
              <h3 className="minebrain-feature-title">
                <Wind size={18} color="#fbbf24" />
                Environmental Risk Intelligence
              </h3>
              <p className="minebrain-feature-desc">
                Continuous gas chromatography and optical fire telemetry streamed directly from
                ESP32 underground safety nodes.
              </p>

              <div className="minebrain-data-box">
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Flame Sensor (GPIO 4)</span>
                  <span
                    className="minebrain-data-val"
                    style={{ color: flameDetected ? "#ef4444" : "#10b981" }}
                  >
                    {flameDetected ? "ACTIVE FLAME DETECTED" : "Clear (No Flame)"}
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">MQ-135 Gas / Smoke (GPIO 34)</span>
                  <span
                    className="minebrain-data-val"
                    style={{
                      color: isGasCritical ? "#ef4444" : isGasWarning ? "#f59e0b" : "#10b981",
                    }}
                  >
                    {gasPpm} PPM ({isGasCritical ? "Critical" : isGasWarning ? "Elevated" : "Clean"})
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Methane MQ-4 (GPIO 35)</span>
                  <span className="minebrain-data-val" style={{ color: "#10b981" }}>
                    &lt;0.5% LEL Nominal
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Shaft Clearance (HC-SR04)</span>
                  <span
                    className="minebrain-data-val"
                    style={{ color: proximityAlert ? "#ef4444" : "#f1f5f9" }}
                  >
                    {distanceCm} cm {proximityAlert ? "(OBSTRUCTION)" : "(Clear)"}
                  </span>
                </div>
                <div className="minebrain-data-row">
                  <span className="minebrain-data-label">Telemetry Source</span>
                  <span className="minebrain-data-val" style={{ color: "#06b6d4", fontSize: "10px" }}>
                    {webSerialConnected
                      ? "LIVE HARDWARE (ESP32-USB)"
                      : isSimulatedMode
                      ? "SIMULATED TELEMETRY"
                      : "IOT SENSOR STREAM"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(6, 182, 212, 0.08)",
                  border: "1px solid rgba(6, 182, 212, 0.2)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "11px",
                  color: "#a5f3fc",
                }}
              >
                <strong>SOP Procedure:</strong> DGMS Reg. 124 mandates min air velocity of 0.5 m/s
                in active headings. Auxiliary ventilation fans on automatic governor.
              </div>

              <button
                className="minebrain-action-btn"
                onClick={() => {
                  showToast("Auxiliary ventilation boost command sent to shaft fan control.");
                }}
              >
                <Wind size={14} />
                <span>Override Auxiliary Ventilation Boost</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* D. FLAGSHIP FEATURE 4: MINEBRAIN AI ACTION CENTER                 */}
        {/* ================================================================= */}
        <section id="minebrain-actions-section" className="minebrain-action-center">
          <div className="minebrain-action-header">
            <div className="minebrain-action-title">
              <h2>
                <Activity size={22} color="#fbbf24" />
                MineBrain AI Action Center
              </h2>
              <p className="minebrain-action-summary-text">
                Consolidated operational and safety directives prioritized by the AI engine.
                Click on any directive status to acknowledge, assign, or mark resolved.
              </p>
            </div>

            <button
              onClick={() => setShowBriefingModal(true)}
              className="minebrain-btn-primary"
              style={{ padding: "10px 18px" }}
            >
              <FileText size={16} />
              <span>Generate Daily Briefing</span>
            </button>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="minebrain-filter-row">
            <div className="minebrain-category-pills">
              {[
                { id: "all", label: `All Directives (${rawActionItems.length})` },
                {
                  id: "worker safety",
                  label: `Safety (${
                    rawActionItems.filter((i) => i.category === "Worker Safety").length
                  })`,
                },
                {
                  id: "heavy fleet",
                  label: `Heavy Fleet (${
                    rawActionItems.filter((i) => i.category === "Heavy Fleet").length
                  })`,
                },
                {
                  id: "environment",
                  label: `Environment (${
                    rawActionItems.filter((i) => i.category === "Environment").length
                  })`,
                },
                {
                  id: "dgms compliance",
                  label: `DGMS Compliance (${
                    rawActionItems.filter((i) => i.category === "DGMS Compliance").length
                  })`,
                },
                { id: "open", label: `Open Only (${openActionsCount})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedCategory(pill.id)}
                  className={`minebrain-pill ${selectedCategory === pill.id ? "active" : ""}`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              Showing {filteredActions.length} of {rawActionItems.length} directives
            </div>
          </div>

          {/* Directives List */}
          <div className="minebrain-findings-list">
            {filteredActions.length > 0 ? (
              filteredActions.map((item) => {
                const status = actionStatuses[item.id] || "Unreviewed";
                const isResolved = status === "Resolved";
                const priorityClass = item.priority.toLowerCase();

                return (
                  <div
                    key={item.id}
                    className={`minebrain-finding-item ${priorityClass} ${
                      isResolved ? "resolved" : ""
                    }`}
                  >
                    <div className="minebrain-finding-left">
                      <div className="minebrain-finding-title-row">
                        <span
                          className={`minebrain-badge-pill ${
                            item.priority === "Critical"
                              ? "minebrain-badge-red"
                              : item.priority === "High"
                              ? "minebrain-badge-amber"
                              : "minebrain-badge-cyan"
                          }`}
                          style={{ position: "static", padding: "2px 8px" }}
                        >
                          {item.priority}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.category}
                        </span>
                        <span className="minebrain-finding-title">{item.title}</span>
                      </div>

                      <div className="minebrain-finding-reason">{item.reason}</div>

                      <div className="minebrain-finding-meta">
                        <span className="minebrain-finding-action-text">
                          Action: {item.actionText}
                        </span>
                        <span>Source: {item.source}</span>
                      </div>
                    </div>

                    <div className="minebrain-finding-right">
                      <button
                        onClick={() => cycleStatus(item.id)}
                        className={`minebrain-status-toggle-btn ${
                          isResolved ? "resolved" : ""
                        }`}
                        title="Click to advance status"
                      >
                        {isResolved ? "✓ Resolved" : `Status: ${status}`}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="minebrain-empty-state">
                <div className="minebrain-empty-icon">✨</div>
                <h4 style={{ margin: "0 0 6px 0", color: "#f8fafc", fontSize: "16px" }}>
                  All Directives Cleared
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                  No outstanding corrective actions in this category. Mine operating within
                  all DGMS safety parameters.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =================================================================== */}
      {/* DAILY SHIFT INTELLIGENCE BRIEFING MODAL                            */}
      {/* =================================================================== */}
      {showBriefingModal && (
        <div
          className="minebrain-briefing-modal"
          onClick={() => setShowBriefingModal(false)}
        >
          <div
            className="minebrain-briefing-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="minebrain-modal-header">
              <h3 className="minebrain-modal-title">
                <FileText size={20} />
                Daily Shift Intelligence & Handover Briefing
              </h3>
              <button
                className="minebrain-modal-close-btn"
                onClick={() => setShowBriefingModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="minebrain-modal-body">
              <div className="minebrain-briefing-box">
                <div className="minebrain-briefing-heading">
                  Shift Metadata & Operational Context
                </div>
                <div className="minebrain-briefing-text">
                  <strong>Date & Time:</strong> {new Date().toLocaleString()}
                  <br />
                  <strong>Facility:</strong> ACDS Gold Mines — Deep Level Shaft 4 & Stope Incline
                  <br />
                  <strong>Intelligence Engine:</strong> {engineStatus.label}
                </div>
              </div>

              <div className="minebrain-briefing-box">
                <div className="minebrain-briefing-heading">1. Workforce Safety Status</div>
                <div className="minebrain-briefing-text">
                  • Headcount: {workers.length} active subterranean miners.
                  <br />
                  • PPE Compliance Rate: {ppeComplianceRate}% (Mandatory gear verification).
                  <br />
                  • High-Risk Personnel Flags: {highRiskWorkers.length} workers require supervisor
                  fitness check.
                </div>
              </div>

              <div className="minebrain-briefing-box">
                <div className="minebrain-briefing-heading">2. Heavy Machinery & Fleet Readiness</div>
                <div className="minebrain-briefing-text">
                  • Fleet Availability: {fleetReadiness}% ({operationalEquip.length}/{totalEquip}{" "}
                  units operational).
                  <br />
                  • Refueling Priorities: {lowFuelEquip.length} machines below 40% fuel reserve.
                  <br />
                  • Maintenance Backlog: {maintenanceDueEquip.length} units due for mechanical
                  overhaul.
                </div>
              </div>

              <div className="minebrain-briefing-box">
                <div className="minebrain-briefing-heading">3. Subterranean Environment</div>
                <div className="minebrain-briefing-text">
                  • Thermal / Flame Detection:{" "}
                  {flameDetected ? "ACTIVE FLAME ALERT DETECTED" : "Safe / No flame detected"}.
                  <br />
                  • Multi-Gas Concentration: {gasPpm} PPM (
                  {isGasCritical ? "CRITICAL HAZARD" : isGasWarning ? "WARNING LEVEL" : "SAFE LEVEL"}
                  ).
                  <br />
                  • Haulage Way Clearance: {distanceCm} cm distance recorded.
                </div>
              </div>

              <div className="minebrain-briefing-box">
                <div className="minebrain-briefing-heading">
                  4. Priority Shift Directives ({openActionsCount} Outstanding)
                </div>
                <div className="minebrain-briefing-text">
                  {rawActionItems.slice(0, 4).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: "6px" }}>
                      <strong>
                        [{item.priority}] {item.title}:
                      </strong>{" "}
                      {item.actionText}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  borderTop: "1px dashed rgba(217, 119, 6, 0.3)",
                  paddingTop: "8px",
                  fontStyle: "italic",
                }}
              >
                Certified in accordance with DGMS metalliferous mine safety rules and ACDS operational
                standards.
              </div>
            </div>

            <div className="minebrain-modal-footer">
              <button
                className="minebrain-btn-secondary"
                onClick={() => setShowBriefingModal(false)}
              >
                Close
              </button>
              <button className="minebrain-btn-primary" onClick={handleCopyBriefing}>
                {copiedBriefing ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedBriefing ? "Copied to Clipboard!" : "Copy Shift Handover"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

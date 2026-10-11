import React, { useState, useEffect, useRef } from "react";
import Mining3DCanvas from "./Mining3DCanvas";
import EdgeIntelligenceTab from "./EdgeIntelligenceTab";
import PPEDetectionPanel from "./PPEDetectionPanel";
import MineBrainIntelligence from "./minebrain/MineBrainIntelligence";

export default function Dashboard({ currentUser, onLogout }) {
  // Navigation Tabs:
  // "overview", "workers", "equipment", "inventory", "environment", "hardware", "waste", "finance", "compliance", "ai"
  const [activeTab, setActiveTab] = useState("overview");

  // Global Mining Data States
  const [workers, setWorkers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [environment, setEnvironment] = useState([]);
  const [waste, setWaste] = useState([]);
  const [finance, setFinance] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [aiData, setAiData] = useState(null);

  // Loading & Connection Status
  const [isLoading, setIsLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(true);
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString());

  // Hardware IoT Telemetry State
  const [hardwareData, setHardwareData] = useState({
    deviceId: "ESP32-MINE-NODE-01",
    flameDetected: false,
    gasPpm: 85,
    gasLevel: "NORMAL",
    distanceCm: 110.0,
    proximityAlert: false,
    buzzerActive: false,
    status: "NORMAL",
    connected: false,
    lastUpdated: new Date().toISOString(),
  });
  const [hardwareHistory, setHardwareHistory] = useState([]);
  const [hardwareAlerts, setHardwareAlerts] = useState([]);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [webSerialConnected, setWebSerialConnected] = useState(false);
  const [serialLog, setSerialLog] = useState([]);
  const serialPortRef = useRef(null);

  // Search & Filter States
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerDeptFilter, setWorkerDeptFilter] = useState("All");
  const [workerShiftFilter, setWorkerShiftFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("All");

  // PPE Monitoring Explanation & Interactive Status State
  const [lastPpeToggledWorker, setLastPpeToggledWorker] = useState(null);

  // Section 23-26: Fire/Gas Worker Safety Alert & CEO Response States
  const [manualEmergencyTest, setManualEmergencyTest] = useState(false);
  const [evacuationBroadcasted, setEvacuationBroadcasted] = useState(false);

  // Section 20-21: PDF Report Upload & Reminders State (Compliance)
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [selectedPdfPreview, setSelectedPdfPreview] = useState(null);
  const [newReport, setNewReport] = useState({
    documentId: "",
    documentName: "",
    documentType: "Mine Safety Audit",
    issuingAuthority: "Directorate General of Mines Safety (DGMS)",
    reminderDays: 7,
    status: "Review Required",
    fileName: "",
    remarks: "",
  });

  // Interactive Form Modals
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showAddWasteModal, setShowAddWasteModal] = useState(false);

  // New Entity Form Data
  const [newWorker, setNewWorker] = useState({
    workerId: "",
    name: "",
    role: "Worker",
    designation: "Mining Worker",
    department: "Mining / Extraction",
    shift: "Morning",
    zone: "Extraction Zone A",
    currentDuty: "Drilling Operation",
    status: "Present",
    attendance: 95,
    ppeStatus: "All PPE Verified",
    riskLevel: "Low",
  });

  const [newEquip, setNewEquip] = useState({
    equipmentId: "",
    equipmentName: "",
    equipmentType: "Excavator",
    currentLocation: "Shaft 3 Pit",
    status: "Operational",
    fuelLevel: 90,
    operatingHours: 120,
    maintenanceStatus: "Up to Date",
  });

  const [newInv, setNewInv] = useState({
    itemId: "",
    itemName: "",
    category: "Safety Equipment",
    quantity: 50,
    minimumStockLevel: 20,
    storageLocation: "Warehouse Bay 2",
    unitCost: 1500,
  });

  const [newWasteEntry, setNewWasteEntry] = useState({
    recordId: "",
    date: new Date().toISOString().split("T")[0],
    wasteType: "Overburden",
    materialName: "Weathered Basalt Rock",
    quantity: 45,
    unit: "Tonnes",
    sourceZone: "Pit 2 North",
    storageLocation: "Waste Rock Dump B",
    reusableQuantity: 20,
    reuseOpportunity: "Road Stabilization Aggregate",
    environmentalRisk: "Low",
  });

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all core backend data
  const fetchAllData = async () => {
    try {
      const [wRes, eRes, iRes, envRes, wstRes, fRes, cRes, aiRes, hwRes] = await Promise.all([
        fetch("http://localhost:5000/api/workers").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/equipment").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/inventory").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/environment").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/waste").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/finance").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/compliance").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/ai-intelligence").then((r) => r.json()).catch(() => null),
        fetch("http://localhost:5000/api/hardware/telemetry").then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(wRes)) setWorkers(wRes);
      if (Array.isArray(eRes)) setEquipment(eRes);
      if (Array.isArray(iRes)) setInventory(iRes);
      if (Array.isArray(envRes)) setEnvironment(envRes);
      if (Array.isArray(wstRes)) setWaste(wstRes);
      if (Array.isArray(fRes)) setFinance(fRes);
      if (Array.isArray(cRes)) setCompliance(cRes);
      if (aiRes) setAiData(aiRes);

      if (hwRes && hwRes.latest) {
        if (!isSimulatedMode && !webSerialConnected) {
          const isLive = Boolean(hwRes.isLive !== false && hwRes.latest.connected !== false);
          const cleanTelemetry = isLive
            ? { ...hwRes.latest, connected: true, connectionStatus: "ONLINE" }
            : {
                ...hwRes.latest,
                connected: false,
                status: "OFFLINE",
                connectionStatus: "OFFLINE",
              };
          console.log(`[FRONTEND] Live sensor data received: status=${cleanTelemetry.status}, flame=${cleanTelemetry.flameDetected}, gas=${cleanTelemetry.gasPpm}ppm, dist=${cleanTelemetry.distanceCm}cm, connected=${cleanTelemetry.connected}`);
          setHardwareData(cleanTelemetry);
          if (Array.isArray(hwRes.history)) setHardwareHistory(hwRes.history);
          if (Array.isArray(hwRes.activeAlerts)) setHardwareAlerts(hwRes.activeAlerts);
        }
      } else {
        if (!isSimulatedMode && !webSerialConnected) {
          setHardwareData((prev) => ({
            ...prev,
            connected: false,
            status: "OFFLINE",
            connectionStatus: "OFFLINE",
          }));
        }
      }

      setServerOnline(true);
      setIsLoading(false);
    } catch (err) {
      console.error("[ERROR] Dashboard fetch error:", err);
      setServerOnline(false);
      setHardwareData((prev) => ({
        ...prev,
        connected: false,
        status: "OFFLINE",
        connectionStatus: "OFFLINE",
      }));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3500);
    return () => clearInterval(interval);
  }, [isSimulatedMode, webSerialConnected]);

  // Dedicated fast-polling for real-time hardware telemetry (1200ms)
  useEffect(() => {
    if (isSimulatedMode || webSerialConnected) return;

    let isMounted = true;
    const pollTelemetry = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/hardware/telemetry");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const hwRes = await res.json();
        if (!isMounted) return;

        if (hwRes && hwRes.latest) {
          const isLive = Boolean(hwRes.isLive !== false && hwRes.latest.connected !== false);
          const cleanTelemetry = isLive
            ? { ...hwRes.latest, connected: true, connectionStatus: "ONLINE" }
            : {
                ...hwRes.latest,
                connected: false,
                status: "OFFLINE",
                connectionStatus: "OFFLINE",
              };

          console.log(`[FRONTEND] Live sensor data received: status=${cleanTelemetry.status}, flame=${cleanTelemetry.flameDetected}, gas=${cleanTelemetry.gasPpm}ppm, dist=${cleanTelemetry.distanceCm}cm, connected=${cleanTelemetry.connected}`);
          setHardwareData(cleanTelemetry);
          if (Array.isArray(hwRes.history)) setHardwareHistory(hwRes.history);
          if (Array.isArray(hwRes.activeAlerts)) setHardwareAlerts(hwRes.activeAlerts);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[ERROR] Sensor API request failed:", err);
          setHardwareData((prev) => ({
            ...prev,
            connected: false,
            status: "OFFLINE",
            connectionStatus: "OFFLINE",
          }));
        }
      }
    };

    const hwTimer = setInterval(pollTelemetry, 1200);
    return () => {
      isMounted = false;
      clearInterval(hwTimer);
    };
  }, [isSimulatedMode, webSerialConnected]);

  // Hardware Simulation Loop (runs when Simulated Mode is active)
  useEffect(() => {
    if (!isSimulatedMode) return;

    const simTimer = setInterval(() => {
      setHardwareData((prev) => {
        // Natural small oscillations
        const flame = prev.flameDetected;
        const gasDelta = (Math.random() - 0.48) * 8;
        const newGas = Math.max(40, Math.min(600, Math.round(prev.gasPpm + gasDelta)));
        const distDelta = (Math.random() - 0.5) * 4;
        const newDist = Math.max(10, Math.min(250, Number((prev.distanceCm + distDelta).toFixed(1))));

        const isGasCrit = newGas >= 320;
        const isGasWarn = newGas >= 180;
        const isProx = newDist < 25;
        const alarm = flame || isGasCrit || isProx;

        const updated = {
          ...prev,
          gasPpm: newGas,
          gasLevel: isGasCrit ? "CRITICAL" : isGasWarn ? "WARNING" : "NORMAL",
          distanceCm: newDist,
          proximityAlert: isProx,
          buzzerActive: alarm,
          status: flame ? "FIRE_ALARM" : isGasCrit ? "GAS_HAZARD" : isProx ? "PROXIMITY_HAZARD" : "NORMAL",
          connected: true,
          lastUpdated: new Date().toISOString(),
        };

        // Send simulated reading to backend
        fetch("http://localhost:5000/api/hardware/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }).catch(() => {});

        return updated;
      });
    }, 1200);

    return () => clearInterval(simTimer);
  }, [isSimulatedMode]);

  // WebSerial Connection for ESP32 over USB Cable
  const connectWebSerial = async () => {
    if (!("serial" in navigator)) {
      alert("WebSerial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera.");
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setWebSerialConnected(true);
      setIsSimulatedMode(false);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";

      // Stream reading loop
      (async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            buffer += value;
            const lines = buffer.split("\n");
            buffer = lines.pop(); // keep remainder

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                try {
                  const parsed = JSON.parse(trimmed);
                  setHardwareData((prev) => ({
                    ...prev,
                    ...parsed,
                    connected: true,
                    lastUpdated: new Date().toISOString(),
                  }));

                  setSerialLog((prevLog) => [trimmed, ...prevLog.slice(0, 15)]);

                  // Forward to backend API
                  fetch("http://localhost:5000/api/hardware/telemetry", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(parsed),
                  }).catch(() => {});
                } catch (parseErr) {
                  // Ignore incomplete JSON chunks
                }
              }
            }
          }
        }
      })();
    } catch (err) {
      console.error("WebSerial Error:", err);
      alert("Could not connect to USB Serial port: " + err.message);
      setWebSerialConnected(false);
    }
  };

  const disconnectWebSerial = async () => {
    if (serialPortRef.current) {
      try {
        await serialPortRef.current.close();
      } catch (e) {}
      serialPortRef.current = null;
    }
    setWebSerialConnected(false);
  };

  // Buzzer Manual Test Trigger
  const triggerBuzzerTest = async () => {
    try {
      await fetch("http://localhost:5000/api/hardware/buzzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TEST" }),
      });
      // Sound a local synthetic web audio beep
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);

      setHardwareData((prev) => ({ ...prev, buzzerActive: true }));
      setTimeout(() => {
        setHardwareData((prev) => ({ ...prev, buzzerActive: false }));
      }, 1000);
    } catch (e) {
      console.warn("Buzzer test error:", e);
    }
  };

  // Toggle PPE for Worker (Interactive Simple Logic)
  const toggleWorkerPPE = async (worker) => {
    const newStatus =
      worker.ppeStatus === "All PPE Verified" ? "PPE Missing" : "All PPE Verified";
    const newRisk = newStatus === "PPE Missing" ? "High" : "Low";

    try {
      const res = await fetch(`http://localhost:5000/api/workers/${worker._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ppeStatus: newStatus, riskLevel: newRisk }),
      });
      if (res.ok) {
        setWorkers((prev) =>
          prev.map((w) => (w._id === worker._id ? { ...w, ppeStatus: newStatus, riskLevel: newRisk } : w))
        );
        setLastPpeToggledWorker({
          workerId: worker.workerId,
          name: worker.name,
          ppeStatus: newStatus,
          riskLevel: newRisk,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.error("Error updating worker PPE:", err);
    }
  };

  // Sync PPE status from Roboflow AI Inspection
  const handleUpdateWorkerPPE = async (workerId, newStatus) => {
    const target = workers.find((w) => w.workerId === workerId);
    if (!target) return;
    const newRisk = newStatus === "PPE Missing" ? "High" : "Low";
    try {
      const res = await fetch(`http://localhost:5000/api/workers/${target._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ppeStatus: newStatus, riskLevel: newRisk }),
      });
      if (res.ok) {
        setWorkers((prev) =>
          prev.map((w) => (w._id === target._id ? { ...w, ppeStatus: newStatus, riskLevel: newRisk } : w))
        );
        setLastPpeToggledWorker({
          workerId: target.workerId,
          name: target.name,
          ppeStatus: newStatus,
          riskLevel: newRisk,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.error("Error updating worker PPE:", err);
    }
  };

  // Refuel Equipment (Interactive Simple Logic)
  const handleRefuelEquipment = async (item) => {
    const updatedFuel = Math.min(100, item.fuelLevel + 40);
    try {
      const res = await fetch(`http://localhost:5000/api/equipment/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fuelLevel: updatedFuel }),
      });
      if (res.ok) {
        setEquipment((prev) =>
          prev.map((eq) => (eq._id === item._id ? { ...eq, fuelLevel: updatedFuel } : eq))
        );
      }
    } catch (err) {
      console.error("Refuel error:", err);
    }
  };

  // Restock Inventory (+20 items)
  const handleRestockInventory = async (item) => {
    const updatedQty = item.quantity + 20;
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: updatedQty, stockStatus: "In Stock" }),
      });
      if (res.ok) {
        setInventory((prev) =>
          prev.map((inv) =>
            inv._id === item._id ? { ...inv, quantity: updatedQty, stockStatus: "In Stock" } : inv
          )
        );
      }
    } catch (err) {
      console.error("Restock error:", err);
    }
  };

  // Add Worker Submit
  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorker),
      });
      if (res.ok) {
        const saved = await res.json();
        setWorkers([saved, ...workers]);
        setShowAddWorkerModal(false);
        setNewWorker({
          workerId: "",
          name: "",
          role: "Worker",
          designation: "Mining Worker",
          department: "Mining / Extraction",
          shift: "Morning",
          zone: "Extraction Zone A",
          currentDuty: "Drilling Operation",
          status: "Present",
          attendance: 95,
          ppeStatus: "All PPE Verified",
          riskLevel: "Low",
        });
      }
    } catch (err) {
      console.error("Add worker error:", err);
    }
  };

  // Filtered Workers
  const filteredWorkers = workers.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.workerId.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.department.toLowerCase().includes(workerSearch.toLowerCase());
    const matchDept = workerDeptFilter === "All" || w.department === workerDeptFilter;
    const matchShift = workerShiftFilter === "All" || w.shift === workerShiftFilter;
    return matchSearch && matchDept && matchShift;
  });

  // Emergency Fire/Gas/Obstacle Flag & Worker Specific Alert
  const isHardwareLive = Boolean((hardwareData.connected !== false && hardwareData.status !== "OFFLINE") && serverOnline);
  const isObstacle = isHardwareLive && Number(hardwareData.distanceCm) < 25.0 && Number(hardwareData.distanceCm) >= 1.0;
  const isGasCritical = isHardwareLive && Number(hardwareData.gasPpm) >= 320;
  const isGasWarning = isHardwareLive && Number(hardwareData.gasPpm) >= 180;
  const isFlameActive = isHardwareLive && Boolean(hardwareData.flameDetected);
  const isEmergency = isFlameActive || isGasCritical || isObstacle || manualEmergencyTest;
  
  // Specific physical tunnel mapping:
  // Tunnel 2 -> Fire Detection (IR Flame)
  // Tunnel 10 -> Gas Detection (MQ-135)
  // Tunnel 6 -> Object Detection (HC-SR04)
  const activeHazardsList = [];
  if (isFlameActive) {
    activeHazardsList.push({
      tunnelId: "TUNNEL-2",
      standardId: "T2",
      hazard: "FIRE",
      title: "FIRE DETECTED — TUNNEL-2",
      zone: "Tunnel 2 (Central Extraction Shaft)",
      reading: "Active Fire / Flame Detected (IR Flame Sensor)",
      timestamp: hardwareData.lastUpdated || hardwareData.timestamp,
    });
  }
  if (isGasCritical) {
    activeHazardsList.push({
      tunnelId: "TUNNEL-10",
      standardId: "T10",
      hazard: "GAS_CRITICAL",
      title: `GAS LEVEL CRITICAL (${hardwareData.gasPpm} PPM) — TUNNEL-10`,
      zone: "Tunnel 10 (Refuge Spur / Subterranean Incline)",
      reading: `${hardwareData.gasPpm} PPM Toxic Gas (MQ-135 Sensor)`,
      timestamp: hardwareData.lastUpdated || hardwareData.timestamp,
    });
  } else if (isGasWarning) {
    activeHazardsList.push({
      tunnelId: "TUNNEL-10",
      standardId: "T10",
      hazard: "GAS_WARNING",
      title: `GAS DETECTED (${hardwareData.gasPpm} PPM) — TUNNEL-10`,
      zone: "Tunnel 10 (Refuge Spur)",
      reading: `${hardwareData.gasPpm} PPM Gas Warning (MQ-135 Sensor)`,
      timestamp: hardwareData.lastUpdated || hardwareData.timestamp,
    });
  }
  if (isObstacle) {
    activeHazardsList.push({
      tunnelId: "TUNNEL-6",
      standardId: "T6",
      hazard: "OBSTACLE",
      title: `OBJECT DETECTED (${hardwareData.distanceCm} cm) — TUNNEL-6`,
      zone: "Tunnel 6 (Ventilation Adit / Crosscut)",
      reading: `Obstacle Detected at ${hardwareData.distanceCm} cm (< 25 cm Safe Threshold)`,
      timestamp: hardwareData.lastUpdated || hardwareData.timestamp,
    });
  }

  const primaryHazard = activeHazardsList[0] || (manualEmergencyTest ? {
    tunnelId: "TUNNEL-2",
    standardId: "T2",
    hazard: "DRILL",
    title: "FIRE / SAFETY DRILL SIMULATION — TUNNEL-2",
    zone: "Tunnel 2 (Central Extraction Shaft)",
    reading: "Manual Emergency Drill Triggered",
    timestamp: new Date().toISOString(),
  } : null);

  const hazardAlertTitle = primaryHazard
    ? (activeHazardsList.length > 1
        ? activeHazardsList.map((h) => h.title).join(" | ")
        : primaryHazard.title)
    : "FIRE / GAS SAFETY ALERT";

  const hazardZone = primaryHazard ? primaryHazard.zone : "Active Mining Sector";

  const hazardType = primaryHazard
    ? primaryHazard.title
    : "SAFETY HAZARD CONDITION ACTIVE";

  // Find affected worker currently in that hazard zone
  const affectedWorker = workers.find((w) =>
    w.zone === hazardZone ||
    (w.zone && w.zone.toLowerCase().includes(hazardZone.toLowerCase().split(" ")[0]))
  ) || workers[0] || {
    workerId: "W-023",
    name: "Ravi Kumar",
    designation: "Drill & Sump Operator",
    role: "Worker",
    zone: hazardZone,
    currentDuty: "Cyanidation Leaching Monitoring",
  };

  return (
    <div
      className="mineguard-dashboard-root"
      style={{
        minHeight: "100vh",
        color: "#181e24",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* 3D Background Canvas in subtle ambient mode */}
      <Mining3DCanvas mode="subtle" />

      {/* ----------------------------------------------------------- */}
      {/* SECTION 23-26: FIRE/GAS WORKER SAFETY EMERGENCY ALERT       */}
      {/* ----------------------------------------------------------- */}
      {isEmergency && (
        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)",
            color: "#ffffff",
            padding: "16px 24px",
            borderBottom: "3px solid #f59e0b",
            boxShadow: "0 8px 30px rgba(185, 28, 28, 0.5)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  flexShrink: 0,
                }}
              >
                🚨
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "#f59e0b",
                      color: "#181e24",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 900,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    CEO / MANAGER EMERGENCY ACTION
                  </span>
                  <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "0.5px" }}>
                    🚨 {hazardAlertTitle}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "10px 20px",
                    marginTop: "10px",
                    background: "rgba(0, 0, 0, 0.28)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <span style={{ color: "#fca5a5", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                      Zone:
                    </span>
                    <div style={{ fontWeight: 800, fontSize: "14px", color: "#fef08a" }}>
                      📍 {hazardZone}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#fca5a5", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                      Detected:
                    </span>
                    <div style={{ fontWeight: 800, color: "#ffffff" }}>
                      ⚠️ {activeHazardsList.length > 0 ? activeHazardsList.map((h) => h.reading).join(" • ") : primaryHazard?.reading || "Safety Hazard Active"}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#fca5a5", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                      Affected Worker:
                    </span>
                    <div style={{ fontWeight: 800, color: "#ffffff" }}>
                      Worker ID: <span style={{ color: "#fef08a" }}>{affectedWorker.workerId}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#fef08a", fontWeight: 700 }}>
                      Worker Name: {affectedWorker.name}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#fca5a5", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                      Required Action:
                    </span>
                    <div style={{ fontWeight: 900, color: "#fef08a", fontSize: "13px" }}>
                      REMOVE WORKER FROM THIS ZONE IMMEDIATELY
                    </div>
                    <div style={{ fontSize: "10px", color: "#fca5a5" }}>
                      Status: <strong style={{ color: "#ffffff" }}>{evacuationBroadcasted ? "EVACUATION IN PROGRESS" : "EVACUATION REQUIRED"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Action Controls */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignSelf: "center" }}>
              <button
                onClick={() => {
                  setEvacuationBroadcasted(true);
                  setHardwareData((prev) => ({ ...prev, buzzerActive: true }));
                  alert(`[EMERGENCY WORKER ALERT TRANSMITTED]\n\nEvacuation signal broadcasted to Worker ${affectedWorker.name} (${affectedWorker.workerId}) in ${hazardZone}.\nImmediate evacuation instruction issued!`);
                }}
                style={{
                  background: evacuationBroadcasted ? "#16a34a" : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: evacuationBroadcasted ? "#ffffff" : "#181e24",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  fontWeight: 900,
                  fontSize: "12px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🚨</span>
                <span>{evacuationBroadcasted ? "Evacuation Signal Active" : "EMERGENCY WORKER ALERT"}</span>
              </button>

              <button
                onClick={() => {
                  setHardwareData((prev) => ({ ...prev, flameDetected: false, buzzerActive: false }));
                  setManualEmergencyTest(false);
                  setEvacuationBroadcasted(false);
                }}
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Clear / Silence Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TOP COMMAND HEADER                                          */}
      {/* ----------------------------------------------------------- */}
      <header
        style={{
          height: "64px",
          position: "relative",
          background: "rgba(255, 255, 255, 0.96)",
          boxShadow: "0 4px 20px rgba(180, 130, 95, 0.08)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(217, 119, 6, 0.22)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
            }}
          >
            ⛏️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "1.5px", color: "#181e24" }}>
              ACDS <span style={{ color: "#d97706" }}>GOLD MINES</span>
            </div>
            <div style={{ fontSize: "10px", color: "#78350f", letterSpacing: "0.5px", fontWeight: 700 }}>
              SMART GOLD MINING INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        {/* Live System Telemetry Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "20px",
              background: "rgba(254, 243, 199, 0.55)",
              border: "1px solid rgba(217, 119, 6, 0.25)",
              fontSize: "11px",
              color: "#451a03",
              fontWeight: 600,
            }}
          >
            <span style={{ color: serverOnline ? "#10b981" : "#ef4444" }}>●</span>
            <span>Server: {serverOnline ? "Online (5000)" : "Offline"}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "20px",
              background: "rgba(254, 243, 199, 0.55)",
              border: "1px solid rgba(217, 119, 6, 0.25)",
              fontSize: "11px",
              color: "#451a03",
              fontWeight: 600,
            }}
          >
            <span style={{ color: webSerialConnected || hardwareData.connected ? "#10b981" : "#eab308" }}>
              ●
            </span>
            <span>
              ESP32:{" "}
              {webSerialConnected
                ? "USB Serial Live"
                : isSimulatedMode
                ? "Simulation Mode"
                : hardwareData.connected
                ? "Wi-Fi Telemetry"
                : "Standby"}
            </span>
          </div>

          <div
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              background: "rgba(254, 243, 199, 0.75)",
              border: "1px solid rgba(217, 119, 6, 0.35)",
              color: "#b45309",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            🕒 {liveClock}
          </div>

          <button
            onClick={() => setManualEmergencyTest(!manualEmergencyTest)}
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              background: manualEmergencyTest ? "#ef4444" : "rgba(245, 158, 11, 0.15)",
              border: manualEmergencyTest ? "1px solid #dc2626" : "1px solid rgba(217, 119, 6, 0.35)",
              color: manualEmergencyTest ? "#ffffff" : "#b45309",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.2s ease",
            }}
            title="Toggle Worker Emergency Alert Simulation"
          >
            <span>{manualEmergencyTest ? "🚨 Emergency Drill Active" : "⚡ Test Worker Alert"}</span>
          </button>
        </div>

        {/* User Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#181e24" }}>
              {currentUser?.name || "Authorized Manager"}
            </div>
            <div style={{ fontSize: "10px", color: "#b45309", fontWeight: 600 }}>
              {currentUser?.role || "Gold Mine Safety Director"} • {currentUser?.workerId || "ACDS-ADMIN"}
            </div>
          </div>

          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.18)",
              border: "1px solid #d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              color: "#b45309",
              fontWeight: 800,
            }}
          >
            {currentUser?.name ? currentUser.name.charAt(0) : "A"}
          </div>

          <button
            onClick={onLogout}
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#b91c1c",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------- */}
      {/* NAVIGATION TABS BAR                                         */}
      {/* ----------------------------------------------------------- */}
      <nav
        style={{
          position: "relative",
          background: "rgba(250, 248, 245, 0.98)",
          boxShadow: "0 2px 10px rgba(180, 130, 95, 0.05)",
          borderBottom: "1px solid rgba(217, 119, 6, 0.22)",
          padding: "8px 24px",
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          zIndex: 20,
        }}
      >
        {[
          { id: "overview", label: "Overview & 3D Site", icon: "🌐" },
          { id: "edge", label: "Edge AI Evacuation & Helmet", icon: "🛡️", badge: isEmergency ? "ALERT" : null },
          { id: "hardware", label: "Fire & Gas IoT (Hardware)", icon: "🔥", badge: isEmergency ? "ALERT" : null },
          { id: "workers", label: "Workforce & Safety", icon: "👷" },
          { id: "equipment", label: "Gold Mining Heavy Fleet", icon: "🚜" },
          { id: "environment", label: "Environment & Mine AQI", icon: "🌱" },
          { id: "compliance", label: "Compliance & DGMS Protocols", icon: "📜" },
          { id: "ai", label: "AI Mining Intelligence", icon: "🧠" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "10px",
                background: isActive ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#ffffff",
                boxShadow: isActive ? "0 4px 14px rgba(217, 119, 6, 0.3)" : "0 2px 6px rgba(180, 130, 95, 0.06)",
                border: `1px solid ${isActive ? "#b45309" : "rgba(217, 119, 6, 0.22)"}`,
                color: isActive ? "#181e24" : "#334155",
                fontSize: "12px",
                fontWeight: isActive ? 800 : 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "9px",
                    fontWeight: 800,
                    animation: "pulse 1s infinite alternate",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ----------------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                           */}
      {/* ----------------------------------------------------------- */}
      <main
        style={{
          flex: 1,
          position: "relative",
          padding: "24px",
          maxWidth: "1600px",
          width: "100%",
          margin: "0 auto",
          zIndex: 10,
        }}
      >
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & 3D SITE COMMAND CENTER                   */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Quick KPI Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                  boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                  backdropFilter: "blur(14px)",
                  padding: "20px",
                  borderRadius: "16px",
                  border: "1px solid rgba(217, 119, 6, 0.22)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700 }}>
                  <span>GOLD MINE WORKFORCE</span>
                  <span>👷</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#181e24", margin: "8px 0" }}>
                  {workers.length} Personnel
                </div>
                <div style={{ fontSize: "11px", color: "#047857", display: "flex", gap: "8px", fontWeight: 600 }}>
                  <span>✓ 100% Shift Coverage</span>
                  <span style={{ color: "#b45309" }}>
                    • {workers.filter((w) => w.riskLevel === "High" || w.riskLevel === "Critical").length} High Risk
                  </span>
                </div>
              </div>

              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                  boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                  backdropFilter: "blur(14px)",
                  padding: "20px",
                  borderRadius: "16px",
                  border: "1px solid rgba(217, 119, 6, 0.22)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700 }}>
                  <span>GOLD FLEET HEALTH</span>
                  <span>🚜</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#181e24", margin: "8px 0" }}>
                  {equipment.filter((e) => e.status === "Operational").length} / {equipment.length} Units
                </div>
                <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: 600 }}>
                  <span>93.4% Operational Readiness • Ore Haulage Active</span>
                </div>
              </div>

              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                  boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                  backdropFilter: "blur(14px)",
                  padding: "20px",
                  borderRadius: "16px",
                  border: "1px solid rgba(217, 119, 6, 0.22)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700 }}>
                  <span>MINE ATMOSPHERE & AQI</span>
                  <span>🌱</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#047857", margin: "8px 0" }}>
                  AQI 58 • Good
                </div>
                <div style={{ fontSize: "11px", color: "#334155", fontWeight: 600 }}>
                  <span>PM2.5: 28 µg/m³ • Dust Suppression Active on Haul Roads</span>
                </div>
              </div>

              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                  boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                  backdropFilter: "blur(14px)",
                  padding: "20px",
                  borderRadius: "16px",
                  border: "1px solid rgba(217, 119, 6, 0.22)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "11px", fontWeight: 700 }}>
                  <span>PHYSICAL SENSOR TELEMETRY (T2 • T10 • T6)</span>
                  <span>🔥💨📡</span>
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: !isHardwareLive
                      ? "#64748b"
                      : isFlameActive || isGasCritical || isObstacle
                      ? "#dc2626"
                      : isGasWarning
                      ? "#d97706"
                      : "#047857",
                    margin: "8px 0",
                  }}
                >
                  {!isHardwareLive
                    ? "OFFLINE / NO RECENT DATA"
                    : isFlameActive
                    ? "🔥 FIRE DETECTED (TUNNEL-2)"
                    : isGasCritical
                    ? `💨 GAS CRITICAL (${hardwareData.gasPpm} PPM) — TUNNEL-10`
                    : isGasWarning
                    ? `⚠️ GAS DETECTED (${hardwareData.gasPpm} PPM) — TUNNEL-10`
                    : isObstacle
                    ? `⛔ OBJECT DETECTED (${hardwareData.distanceCm}cm) — TUNNEL-6`
                    : "✓ ALL SENSORS NORMAL"}
                </div>
                <div style={{ fontSize: "11px", color: "#334155", fontWeight: 600 }}>
                  <span>
                    {!isHardwareLive
                      ? "Hardware sensor node offline or waiting for telemetry"
                      : `T2: ${isFlameActive ? "FIRE" : "CLEAR"} | T10: ${hardwareData.gasPpm} PPM Gas | T6: ${hardwareData.distanceCm} cm`}
                  </span>
                </div>
              </div>
            </div>

            {/* 3D Visualizer & Site Map Hub */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "20px",
              }}
            >
              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                  boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                  borderRadius: "20px",
                  border: "1px solid rgba(217, 119, 6, 0.25)",
                  padding: "24px",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: "420px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "18px", color: "#181e24", fontWeight: 800 }}>
                      ACDS Gold Mines — 3D Mine Topology & Sensor Nodes
                    </h2>
                    <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "12px" }}>
                      Interactive photorealistic gold quarry digital twin — drag to orbit, scroll to zoom.
                    </p>
                  </div>
                  <span
                    style={{
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#b45309",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 800,
                      border: "1px solid rgba(217, 119, 6, 0.3)",
                    }}
                  >
                    ACDS Gold Mines · Digital Twin
                  </span>
                </div>

                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    minHeight: "260px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    margin: "16px 0",
                    border: "1px solid rgba(217, 119, 6, 0.25)",
                    background: "#292925",
                  }}
                >
                  <iframe
                    title="CANTERA DE ÁRIDOS EN PADÚL (GRANADA)"
                    frameBorder="0"
                    allowFullScreen
                    mozallowfullscreen="true"
                    webkitallowfullscreen="true"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    xr-spatial-tracking="true"
                    execution-while-out-of-viewport="true"
                    execution-while-not-rendered="true"
                    web-share="true"
                    src="https://sketchfab.com/models/c5a908f823cd491ea352a334e25f114d/embed"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(255, 255, 255, 0.94)",
                      boxShadow: "0 4px 12px rgba(180, 130, 95, 0.12)",
                      backdropFilter: "blur(10px)",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(217, 119, 6, 0.3)",
                      fontSize: "11px",
                      color: "#334155",
                      pointerEvents: "none",
                      fontWeight: 600,
                    }}
                  >
                    Interactive: Drag to orbit · Scroll to zoom
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", zIndex: 5, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setActiveTab("edge")}
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      border: "none",
                      color: "#ffffff",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                    }}
                  >
                    🛡️ Edge Evacuation Routing →
                  </button>

                  <button
                    onClick={() => setActiveTab("hardware")}
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      border: "none",
                      color: "#181e24",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)",
                    }}
                  >
                    Open Fire & Gas IoT Console →
                  </button>

                  <button
                    onClick={() => setActiveTab("ai")}
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(217, 119, 6, 0.35)",
                      color: "#b45309",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    View AI Predictive Report
                  </button>
                </div>
              </div>

              {/* Live Alerts Feed */}
              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                  boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                  borderRadius: "20px",
                  border: "1px solid rgba(217, 119, 6, 0.22)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#181e24", fontWeight: 800 }}>
                    Live Gold Mine Operations Log
                  </h3>
                  <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 700 }}>
                    {aiData?.alerts?.length || 0} Open Items
                  </span>
                </div>

                <div style={{ display: "grid", gap: "10px", overflowY: "auto", maxHeight: "330px" }}>
                  {/* Dynamic Hardware Alert if any */}
                  {hardwareData.flameDetected && (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid #ef4444",
                        color: "#991b1b",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#dc2626" }}>🚨 CRITICAL: SHAFT FIRE SENSOR ACTIVE</div>
                      <div style={{ marginTop: "4px" }}>Flame detected on node ESP32-MINE-NODE-01 in subterranean level 3. Buzzer siren triggered.</div>
                    </div>
                  )}

                  {aiData?.alerts?.map((alt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        background:
                          alt.severity === "High"
                            ? "rgba(239, 68, 68, 0.08)"
                            : "rgba(245, 158, 11, 0.08)",
                        border: `1px solid ${
                          alt.severity === "High" ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.25)"
                        }`,
                        fontSize: "11px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: alt.severity === "High" ? "#dc2626" : "#b45309",
                          marginBottom: "4px",
                        }}
                      >
                        {alt.title}
                      </div>
                      <div style={{ color: "#334155", lineHeight: 1.5 }}>{alt.message}</div>
                    </div>
                  ))}

                  {(!aiData?.alerts || aiData.alerts.length === 0) && (
                    <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b", fontSize: "12px" }}>
                      ✓ All ACDS Gold Mines systems operating within nominal safety thresholds.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        
        {/* ========================================================= */}
        {/* TAB: EDGE EMERGENCY INTELLIGENCE & EVACUATION ROUTING      */}
        {/* ========================================================= */}
        {activeTab === "edge" && (
          <EdgeIntelligenceTab
            hardwareData={hardwareData}
            onTriggerBuzzer={triggerBuzzerTest}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 2: FIRE & GAS DETECTION (ESP32 HARDWARE HUB)          */}
        {/* ========================================================= */}
        {activeTab === "hardware" && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Header & Connection Control Bar */}
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
                <h2 style={{ margin: 0, fontSize: "20px", color: "#181e24", fontWeight: 800 }}>
                  ACDS Gold Mines — IoT Smart Safety Node (ESP32 Integration)
                </h2>
                <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "12px" }}>
                  Subterranean Shaft & Gold Ore Processing Gas/Fire Monitoring Station (ESP32 • Flame • MQ-135 Gas • HC-SR04 • OLED • Buzzer)
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* One-click WebSerial Connect Button */}
                {!webSerialConnected ? (
                  <button
                    onClick={connectWebSerial}
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "#181e24",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)",
                    }}
                  >
                    <span>🔌</span> Connect USB ESP32 (One-Click)
                  </button>
                ) : (
                  <button
                    onClick={disconnectWebSerial}
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid #ef4444",
                      color: "#b91c1c",
                      padding: "10px 18px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Disconnect USB Serial
                  </button>
                )}

                {/* Simulation Mode Toggle */}
                <button
                  onClick={() => setIsSimulatedMode(!isSimulatedMode)}
                  style={{
                    background: isSimulatedMode ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${isSimulatedMode ? "#10b981" : "rgba(255, 255, 255, 0.15)"}`,
                    color: isSimulatedMode ? "#34d399" : "#cbd5e1",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {isSimulatedMode ? "✓ Hardware Simulation: ACTIVE" : "Enable Test Simulation"}
                </button>

                {/* Buzzer Test Button */}
                <button
                  onClick={triggerBuzzerTest}
                  style={{
                    background: "#fff5f8",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    color: "#181e24",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  🔊 Test Hardware Buzzer
                </button>
              </div>
            </div>

            {/* Python Collector Single Port Ownership Architecture Notice */}
            <div
              style={{
                background: "linear-gradient(145deg, #f8fafc, #fffdfa)",
                borderRadius: "14px",
                border: "1px solid rgba(217, 119, 6, 0.2)",
                padding: "12px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                color: "#334155",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <strong>🔌 Hardware Architecture:</strong> Single Port Ownership via{" "}
                <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>
                  hardware/collector.py
                </code>
                . ESP32 serial data flows: <em>ESP32 → Python Collector → Local Edge API → Routing Engine</em>.
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span
                  style={{
                    background: "#dcfce7",
                    color: "#15803d",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "11px",
                  }}
                >
                  ✓ No Port Conflict
                </span>
                <button
                  onClick={() => setActiveTab("edge")}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    border: "none",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View Edge Evacuation Map →
                </button>
              </div>
            </div>

            {/* Live Sensor Telemetry Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {/* 1. Flame Sensor Card -> TUNNEL-2 */}
              <div
                style={{
                  background: isFlameActive
                    ? "rgba(239, 68, 68, 0.2)"
                    : !isHardwareLive
                    ? "rgba(71, 85, 105, 0.15)"
                    : "rgba(15, 20, 25, 0.8)",
                  borderRadius: "18px",
                  border: `2px solid ${
                    isFlameActive
                      ? "#ef4444"
                      : !isHardwareLive
                      ? "#64748b"
                      : "rgba(255, 255, 255, 0.08)"
                  }`,
                  padding: "24px",
                  transition: "all 0.3s ease",
                  boxShadow: isFlameActive ? "0 0 35px rgba(239, 68, 68, 0.4)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span
                      style={{
                        background: isFlameActive ? "#ef4444" : "#1e293b",
                        color: isFlameActive ? "#ffffff" : "#38bdf8",
                        padding: "2px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 800,
                        marginRight: "6px",
                      }}
                    >
                      TUNNEL-2
                    </span>
                    <span style={{ fontSize: "12px", color: "#334155", fontWeight: 700 }}>
                      IR FLAME DETECTOR
                    </span>
                  </div>
                  <span style={{ fontSize: "24px" }}>🔥</span>
                </div>

                <div style={{ margin: "20px 0", textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 900,
                      color: !isHardwareLive
                        ? "#64748b"
                        : isFlameActive
                        ? "#ef4444"
                        : "#10b981",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {!isHardwareLive
                      ? "⚪ OFFLINE / NO RECENT DATA"
                      : isFlameActive
                      ? "🔥 FIRE DETECTED"
                      : "✓ NORMAL (NO FLAME)"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#334155", marginTop: "6px" }}>
                    Sensor: Digital Pin GPIO 4 (Active LOW) • Tunnel: T2
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                    Last Seen: {hardwareData.lastUpdated || hardwareData.timestamp ? new Date(hardwareData.lastUpdated || hardwareData.timestamp).toLocaleTimeString() : "N/A"} • Status:{" "}
                    <strong style={{ color: isHardwareLive ? "#10b981" : "#ef4444" }}>
                      {isHardwareLive ? "ONLINE" : "OFFLINE"}
                    </strong>
                  </div>
                </div>

                {isSimulatedMode && (
                  <div style={{ marginTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "12px" }}>
                    <button
                      onClick={() =>
                        setHardwareData((prev) => ({ ...prev, flameDetected: !prev.flameDetected }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        background: hardwareData.flameDetected ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                        border: "1px solid #ef4444",
                        color: "#fff",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {hardwareData.flameDetected ? "Extinguish Simulated Flame" : "Trigger Simulated Flame"}
                    </button>
                  </div>
                )}
              </div>

              {/* 2. MQ-135 Gas Sensor Card -> TUNNEL-10 */}
              <div
                style={{
                  background: !isHardwareLive
                    ? "rgba(71, 85, 105, 0.15)"
                    : isGasCritical
                    ? "rgba(239, 68, 68, 0.2)"
                    : isGasWarning
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(15, 20, 25, 0.8)",
                  borderRadius: "18px",
                  border: `2px solid ${
                    !isHardwareLive
                      ? "#64748b"
                      : isGasCritical
                      ? "#ef4444"
                      : isGasWarning
                      ? "#f59e0b"
                      : "rgba(255, 255, 255, 0.08)"
                  }`,
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span
                      style={{
                        background: isGasCritical ? "#ef4444" : isGasWarning ? "#f59e0b" : "#1e293b",
                        color: isGasCritical || isGasWarning ? "#ffffff" : "#38bdf8",
                        padding: "2px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 800,
                        marginRight: "6px",
                      }}
                    >
                      TUNNEL-10
                    </span>
                    <span style={{ fontSize: "12px", color: "#334155", fontWeight: 700 }}>
                      MQ-135 AIR QUALITY & GAS
                    </span>
                  </div>
                  <span style={{ fontSize: "24px" }}>💨</span>
                </div>

                <div style={{ margin: "16px 0" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "38px",
                        fontWeight: 900,
                        color: !isHardwareLive
                          ? "#64748b"
                          : isGasCritical
                          ? "#ef4444"
                          : isGasWarning
                          ? "#f59e0b"
                          : "#10b981",
                      }}
                    >
                      {!isHardwareLive ? "--" : hardwareData.gasPpm}
                    </span>
                    <span style={{ fontSize: "16px", color: "#334155" }}>PPM</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: !isHardwareLive
                          ? "#475569"
                          : isGasCritical
                          ? "#ef4444"
                          : isGasWarning
                          ? "#f59e0b"
                          : "#10b981",
                        color: "#ffffff",
                      }}
                    >
                      {!isHardwareLive
                        ? "OFFLINE"
                        : isGasCritical
                        ? "CRITICAL"
                        : isGasWarning
                        ? "WARNING"
                        : "NORMAL"}
                    </span>
                  </div>

                  {/* Gas Progress Bar */}
                  <div
                    style={{
                      height: "8px",
                      background: "#e2e8f0",
                      borderRadius: "4px",
                      overflow: "hidden",
                      margin: "10px 0",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${!isHardwareLive ? 0 : Math.min(100, (hardwareData.gasPpm / 500) * 100)}%`,
                        background:
                          isGasCritical
                            ? "#ef4444"
                            : isGasWarning
                            ? "#f59e0b"
                            : "#10b981",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "11px", color: "#334155", display: "flex", justifyContent: "space-between" }}>
                    <span>Tunnel: T10 • Danger: &ge; 320 PPM</span>
                    <span>Status: {!isHardwareLive ? "OFFLINE" : isGasCritical ? "GAS LEVEL CRITICAL" : isGasWarning ? "GAS DETECTED" : "NORMAL"}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                    Last Seen: {hardwareData.lastUpdated || hardwareData.timestamp ? new Date(hardwareData.lastUpdated || hardwareData.timestamp).toLocaleTimeString() : "N/A"} • Connection:{" "}
                    <strong style={{ color: isHardwareLive ? "#10b981" : "#ef4444" }}>
                      {isHardwareLive ? "ONLINE" : "OFFLINE"}
                    </strong>
                  </div>
                </div>

                {isSimulatedMode && (
                  <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "10px" }}>
                    <label style={{ fontSize: "10px", color: "#334155" }}>Adjust Gas PPM (Slider):</label>
                    <input
                      type="range"
                      min="30"
                      max="600"
                      value={hardwareData.gasPpm}
                      onChange={(e) =>
                        setHardwareData((prev) => ({ ...prev, gasPpm: Number(e.target.value) }))
                      }
                      style={{ width: "100%", accentColor: "#4f46e5" }}
                    />
                  </div>
                )}
              </div>

              {/* 3. HC-SR04 Ultrasonic Distance Sensor Card -> TUNNEL-6 */}
              <div
                className="mg-pop"
                style={{
                  background: !isHardwareLive
                    ? "rgba(71, 85, 105, 0.15)"
                    : isObstacle
                    ? "linear-gradient(145deg, #fff1f5 0%, #fee2e2 100%)"
                    : "linear-gradient(145deg, #fff1f5 0%, #ffe3ec 100%)",
                  boxShadow: "0 8px 24px rgba(140, 150, 200, 0.08)",
                  borderRadius: "18px",
                  border: `2px solid ${
                    !isHardwareLive
                      ? "#64748b"
                      : isObstacle
                      ? "#ef4444"
                      : "rgba(255, 255, 255, 0.08)"
                  }`,
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span
                      style={{
                        background: isObstacle ? "#ef4444" : "#1e293b",
                        color: isObstacle ? "#ffffff" : "#38bdf8",
                        padding: "2px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 800,
                        marginRight: "6px",
                      }}
                    >
                      TUNNEL-6
                    </span>
                    <span style={{ fontSize: "12px", color: "#334155", fontWeight: 700 }}>
                      HC-SR04 OBJECT DETECTION
                    </span>
                  </div>
                  <span style={{ fontSize: "24px" }}>📡</span>
                </div>

                <div style={{ margin: "16px 0" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "38px",
                        fontWeight: 900,
                        color: !isHardwareLive
                          ? "#64748b"
                          : isObstacle
                          ? "#ef4444"
                          : "#00d2ff",
                      }}
                    >
                      {!isHardwareLive ? "--" : hardwareData.distanceCm}
                    </span>
                    <span style={{ fontSize: "16px", color: "#334155" }}>cm</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: !isHardwareLive
                          ? "#475569"
                          : isObstacle
                          ? "#ef4444"
                          : "#10b981",
                        color: "#ffffff",
                      }}
                    >
                      {!isHardwareLive
                        ? "OFFLINE"
                        : isObstacle
                        ? "OBJECT DETECTED"
                        : "NORMAL"}
                    </span>
                  </div>

                  {/* Distance Bar */}
                  <div
                    style={{
                      height: "8px",
                      background: "#e2e8f0",
                      borderRadius: "4px",
                      overflow: "hidden",
                      margin: "10px 0",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${!isHardwareLive ? 0 : Math.min(100, (hardwareData.distanceCm / 200) * 100)}%`,
                        background: isObstacle ? "#ef4444" : "#00d2ff",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>

                  <div style={{ fontSize: "11px", color: "#334155" }}>
                    {!isHardwareLive
                      ? "⚪ OFFLINE / NO RECENT DATA"
                      : isObstacle
                      ? "⚠️ OBJECT DETECTED: Obstacle within 25cm in Tunnel 6"
                      : "✓ Tunnel 6 Clearance Clear (> 25cm safe zone)"}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                    Last Seen: {hardwareData.lastUpdated || hardwareData.timestamp ? new Date(hardwareData.lastUpdated || hardwareData.timestamp).toLocaleTimeString() : "N/A"} • Connection:{" "}
                    <strong style={{ color: isHardwareLive ? "#10b981" : "#ef4444" }}>
                      {isHardwareLive ? "ONLINE" : "OFFLINE"}
                    </strong>
                  </div>
                </div>

                {isSimulatedMode && (
                  <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "10px" }}>
                    <label style={{ fontSize: "10px", color: "#334155" }}>Adjust Clearance (Slider):</label>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      value={hardwareData.distanceCm}
                      onChange={(e) =>
                        setHardwareData((prev) => ({ ...prev, distanceCm: Number(e.target.value) }))
                      }
                      style={{ width: "100%", accentColor: "#00d2ff" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Virtual SSD1306 OLED Mirror & Hardware Pinout Diagram */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Virtual OLED Mirror */}
              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #fff1f5 0%, #ffe3ec 100%)", boxShadow: "0 8px 24px rgba(140, 150, 200, 0.08)",
                  borderRadius: "18px",
                  border: "1px solid rgba(99, 102, 241, 0.20)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", color: "#334155", fontWeight: 700 }}>
                    VIRTUAL SSD1306 OLED DISPLAY (128x64 MIRROR)
                  </span>
                  <span style={{ fontSize: "11px", color: "#4f46e5" }}>I2C 0x3C</span>
                </div>

                {/* OLED Graphic Frame */}
                <div
                  style={{
                    background: "#000000",
                    border: "8px solid #1e293b",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    fontFamily: "monospace",
                    color: "#38bdf8",
                    boxShadow: "0 0 25px rgba(56, 189, 248, 0.2)",
                    minHeight: "150px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      borderBottom: "1px solid #38bdf8",
                      paddingBottom: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 800,
                      fontSize: "13px",
                    }}
                  >
                    <span>ACDS GOLD MINES - IoT NODE</span>
                    <span>ESP32</span>
                  </div>

                  <div style={{ margin: "10px 0", fontSize: "13px", display: "grid", gap: "4px" }}>
                    <div>
                      FIRE:{" "}
                      {hardwareData.flameDetected ? (
                        <span style={{ background: "#38bdf8", color: "#000", padding: "1px 6px", fontWeight: 800 }}>
                          !! ALERT !!
                        </span>
                      ) : (
                        <span>NORMAL [SAFE]</span>
                      )}
                    </div>
                    <div>
                      GAS: {hardwareData.gasPpm} PPM [{hardwareData.gasLevel}]
                    </div>
                    <div>
                      DIST: {Math.round(hardwareData.distanceCm)} cm{" "}
                      {hardwareData.distanceCm < 25 ? "[PROX!]" : "[CLEAR]"}
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #38bdf8",
                      paddingTop: "4px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {hardwareData.buzzerActive ? "! SIREN ACTIVE !" : "STATE: ALL CLEAR"}
                  </div>
                </div>
              </div>

              {/* Hardware Wiring Quick Reference Card */}
              <div
                className="mg-pop"
                style={{
                  background: "linear-gradient(145deg, #fff1f5 0%, #ffe3ec 100%)", boxShadow: "0 8px 24px rgba(140, 150, 200, 0.08)",
                  borderRadius: "18px",
                  border: "1px solid rgba(99, 102, 241, 0.20)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", color: "#334155", fontWeight: 700 }}>
                    CIRCUIT PINS & SCHEMATIC QUICK GUIDE
                  </span>
                  <span style={{ fontSize: "11px", color: "#10b981" }}>Ready to Flash</span>
                </div>

                <div style={{ display: "grid", gap: "8px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(219, 234, 254, 0.35)", borderRadius: "6px" }}>
                    <span>🔥 Flame Sensor (DO)</span>
                    <span style={{ color: "#b45309", fontWeight: 700 }}>GPIO 4 (Digital In)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(219, 234, 254, 0.35)", borderRadius: "6px" }}>
                    <span>💨 MQ-135 Gas Sensor (AO)</span>
                    <span style={{ color: "#b45309", fontWeight: 700 }}>GPIO 34 (ADC1 Analog)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(219, 234, 254, 0.35)", borderRadius: "6px" }}>
                    <span>📡 Ultrasonic (Trig / Echo)</span>
                    <span style={{ color: "#b45309", fontWeight: 700 }}>GPIO 5 (Trig) / GPIO 18 (Echo)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(219, 234, 254, 0.35)", borderRadius: "6px" }}>
                    <span>🖥️ OLED Display (SDA / SCL)</span>
                    <span style={{ color: "#b45309", fontWeight: 700 }}>GPIO 21 (SDA) / GPIO 22 (SCL)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(219, 234, 254, 0.35)", borderRadius: "6px" }}>
                    <span>🔊 Active Buzzer (+)</span>
                    <span style={{ color: "#b45309", fontWeight: 700 }}>GPIO 23 (Output)</span>
                  </div>
                </div>

                <div style={{ marginTop: "14px", fontSize: "11px", color: "#334155" }}>
                  📄 Firmware ready at: <code style={{ color: "#4f46e5" }}>hardware/mineguard_esp32_firmware.ino</code>
                </div>
              </div>
            </div>

            {/* Section 13: WORKER-SPECIFIC EMERGENCY SAFETY RESPONSE SYSTEM */}
            <div
              className="mg-pop"
              style={{
                background: isEmergency
                  ? "linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)"
                  : "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                boxShadow: isEmergency ? "0 10px 30px rgba(239, 68, 68, 0.2)" : "0 8px 24px rgba(180, 130, 95, 0.08)",
                borderRadius: "18px",
                border: isEmergency ? "2px solid #ef4444" : "1px solid rgba(217, 119, 6, 0.25)",
                padding: "24px",
                marginTop: "4px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>🚨</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: isEmergency ? "#991b1b" : "#181e24" }}>
                      Worker-Specific Fire & Gas Emergency Safety Dispatch
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: isEmergency ? "#b91c1c" : "#64748b" }}>
                      Real-time link between ESP32 Optical Flame / MQ-135 Gas sensors and assigned gold pit personnel
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 800,
                      background: isEmergency
                        ? evacuationBroadcasted
                          ? "#16a34a"
                          : "#ef4444"
                        : "#10b981",
                      color: "#ffffff",
                    }}
                  >
                    {isEmergency
                      ? evacuationBroadcasted
                        ? "STATUS: EVACUATING / ALERT SENT"
                        : "STATUS: EVACUATION REQUIRED"
                      : "STATUS: ALL ZONES SAFE"}
                  </span>

                  <button
                    onClick={() => {
                      setManualEmergencyTest(!manualEmergencyTest);
                      if (manualEmergencyTest) setEvacuationBroadcasted(false);
                    }}
                    style={{
                      background: manualEmergencyTest ? "#ef4444" : "#fffdfa",
                      color: manualEmergencyTest ? "#ffffff" : "#b45309",
                      border: "1px solid rgba(217, 119, 6, 0.35)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {manualEmergencyTest ? "End Drill" : "⚡ Trigger Safety Drill"}
                  </button>
                </div>
              </div>

              {/* Alert Content Details */}
              <div
                style={{
                  background: isEmergency ? "rgba(255, 255, 255, 0.9)" : "#fffdfa",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  border: isEmergency ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(217, 119, 6, 0.18)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                    Hazard Zone:
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: isEmergency ? "#dc2626" : "#181e24", marginTop: "4px" }}>
                    📍 {hazardZone}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    {hardwareData.flameDetected ? "Bench Level 4 Blasting Pit" : "Gold Cyanidation Leach Tanks"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                    Detected Hazard:
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: isEmergency ? "#dc2626" : "#047857", marginTop: "4px" }}>
                    {hardwareData.flameDetected
                      ? "🔥 Fire Detected"
                      : hardwareData.gasPpm >= 320 || manualEmergencyTest
                      ? `💨 Gas Level Critical (${hardwareData.gasPpm} PPM)`
                      : "✓ Gas & Flame Normal"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Telemetry: MQ-135 ({hardwareData.gasPpm} PPM) • Flame DO ({hardwareData.flameDetected ? "ACTIVE" : "CLEAR"})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                    Affected Worker:
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#181e24", marginTop: "4px" }}>
                    👷 [{affectedWorker.workerId} - {affectedWorker.name} - {affectedWorker.currentDuty || affectedWorker.designation}]
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Dept: {affectedWorker.department || "Extraction"} • Shift: {affectedWorker.shift || "Morning"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#dc2626", letterSpacing: "0.5px" }}>
                    Required Action:
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 900, color: isEmergency ? "#b91c1c" : "#047857", marginTop: "4px" }}>
                    {isEmergency ? "REMOVE WORKER FROM THIS ZONE IMMEDIATELY" : "CONTINUE REGULAR MONITORING"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Status: <strong style={{ color: isEmergency ? (evacuationBroadcasted ? "#16a34a" : "#dc2626") : "#047857" }}>
                      {isEmergency ? (evacuationBroadcasted ? "EVACUATING / ALERT SENT" : "EVACUATION REQUIRED") : "NORMAL OPERATIONS"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Emergency Worker Alert Dispatch Button */}
              {isEmergency && (
                <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      setEvacuationBroadcasted(true);
                      setHardwareData((prev) => ({ ...prev, buzzerActive: true }));
                      alert(
                        `🚨 [EMERGENCY WORKER ALERT DISPATCHED]\n\n` +
                        `Hazard Zone: ${hazardZone}\n` +
                        `Detected Hazard: ${hardwareData.flameDetected ? "Fire Detected" : "Gas Level Critical"}\n` +
                        `Affected Worker: [${affectedWorker.workerId} - ${affectedWorker.name} - ${affectedWorker.currentDuty || affectedWorker.designation}]\n` +
                        `Required Action: REMOVE WORKER FROM THIS ZONE IMMEDIATELY\n` +
                        `Status: EVACUATING / ALERT SENT\n\n` +
                        `Safety siren triggered and evacuation protocol logged to DGMS audit stream.`
                      );
                    }}
                    style={{
                      background: evacuationBroadcasted ? "#16a34a" : "linear-gradient(135deg, #ef4444, #dc2626)",
                      border: "none",
                      color: "#ffffff",
                      padding: "12px 24px",
                      borderRadius: "10px",
                      fontWeight: 900,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <span>🚨</span>
                    <span>{evacuationBroadcasted ? "✓ ALERT BROADCASTED — WORKER EVACUATING" : "EMERGENCY WORKER ALERT"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setHardwareData((prev) => ({ ...prev, flameDetected: false, buzzerActive: false }));
                      setManualEmergencyTest(false);
                      setEvacuationBroadcasted(false);
                    }}
                    style={{
                      background: "#fffdfa",
                      border: "1px solid #cbd5e1",
                      color: "#475569",
                      padding: "12px 18px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Clear Alarm / Reset
                  </button>

                  {evacuationBroadcasted && (
                    <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>
                      ✓ Emergency signal transmitted to Worker {affectedWorker.name} ({affectedWorker.workerId}) at {new Date().toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: WORKFORCE & EMPLOYEES                               */}
        {/* ========================================================= */}
        {activeTab === "workers" && (
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Header with Search and Add Worker */}
            <div
              className="mg-pop"
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                borderRadius: "18px",
                border: "1px solid rgba(217, 119, 6, 0.22)",
                padding: "20px 24px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#181e24", fontWeight: 800 }}>
                  ACDS Gold Mines — Workforce Roster & Mine Safety
                </h2>
                <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "12px" }}>
                  Total {workers.length} Personnel Registered across Gold Extraction Benches, Shafts & Processing • Real-time PPE Compliance Enforcement
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search by Name, ID, or Dept..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.25)",
                    color: "#181e24",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    minWidth: "220px",
                  }}
                />

                <select
                  value={workerShiftFilter}
                  onChange={(e) => setWorkerShiftFilter(e.target.value)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.25)",
                    color: "#181e24",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    boxShadow: "0 2px 6px rgba(180, 130, 95, 0.06)",
                  }}
                >
                  <option value="All">All Shifts</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Afternoon">Afternoon Shift</option>
                  <option value="Night">Night Shift</option>
                </select>

                <button
                  onClick={() => setShowAddWorkerModal(true)}
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    color: "#181e24",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)",
                  }}
                >
                  + Add Worker
                </button>
              </div>
            </div>

            {/* Roboflow AI PPE Detection & Verification Studio */}
            <PPEDetectionPanel
              workers={workers}
              onUpdateWorkerPPE={handleUpdateWorkerPPE}
            />

            {/* Section 8: SIMPLIFIED PPE TOGGLE EXPLANATION BANNER */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(254, 243, 199, 0.85), rgba(255, 237, 213, 0.75))",
                border: "1px solid rgba(217, 119, 6, 0.35)",
                borderRadius: "14px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(180, 130, 95, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "800px" }}>
                <span style={{ fontSize: "24px" }}>🦺</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 900, fontSize: "13px", color: lastPpeToggledWorker?.ppeStatus === "PPE Missing" ? "#b91c1c" : "#9a3412", letterSpacing: "0.5px" }}>
                      PPE MONITORING: {lastPpeToggledWorker?.ppeStatus === "PPE Missing" ? "STANDBY / ALERT" : "ACTIVE"}
                    </span>
                    <span
                      style={{
                        background: lastPpeToggledWorker?.ppeStatus === "PPE Missing" ? "#ef4444" : "#10b981",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                    >
                      {lastPpeToggledWorker?.ppeStatus === "PPE Missing" ? "INSPECTION REQUIRED" : "ENFORCEMENT ON"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#451a03", lineHeight: 1.5, fontWeight: 500 }}>
                    {lastPpeToggledWorker?.ppeStatus === "PPE Missing"
                      ? "PPE compliance is unverified or missing for this worker. Immediate inspection required before pit access."
                      : "Workers are required to use the required protective equipment for their assigned mining zone. PPE monitoring helps reduce injury risk and improves worker safety compliance."}
                  </p>
                </div>
              </div>

              {lastPpeToggledWorker ? (
                <div
                  style={{
                    background: lastPpeToggledWorker.ppeStatus === "All PPE Verified" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${lastPpeToggledWorker.ppeStatus === "All PPE Verified" ? "#10b981" : "#ef4444"}`,
                    color: lastPpeToggledWorker.ppeStatus === "All PPE Verified" ? "#047857" : "#b91c1c",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {lastPpeToggledWorker.ppeStatus === "All PPE Verified"
                    ? `✓ PPE Verified: ${lastPpeToggledWorker.name} (${lastPpeToggledWorker.workerId}) — Low Risk`
                    : `⚠️ PPE Missing: ${lastPpeToggledWorker.name} (${lastPpeToggledWorker.workerId}) — High Risk`}
                </div>
              ) : (
                <div style={{ fontSize: "11px", color: "#78350f", fontStyle: "italic" }}>
                  💡 Click <strong>Toggle PPE</strong> on any personnel row below to update equipment verification in real time.
                </div>
              )}
            </div>

            {/* Workers Table */}
            <div
              className="mg-pop"
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, #fffdfa 100%)",
                boxShadow: "0 8px 24px rgba(180, 130, 95, 0.08)",
                borderRadius: "18px",
                border: "1px solid rgba(217, 119, 6, 0.22)",
                overflowX: "auto",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(217, 119, 6, 0.22)", color: "#334155" }}>
                    <th style={{ padding: "14px 16px" }}>WORKER ID</th>
                    <th style={{ padding: "14px 16px" }}>FULL NAME</th>
                    <th style={{ padding: "14px 16px" }}>ROLE / DESIGNATION</th>
                    <th style={{ padding: "14px 16px" }}>DEPARTMENT</th>
                    <th style={{ padding: "14px 16px" }}>SHIFT / ZONE</th>
                    <th style={{ padding: "14px 16px" }}>PPE STATUS</th>
                    <th style={{ padding: "14px 16px" }}>RISK LEVEL</th>
                    <th style={{ padding: "14px 16px" }}>ATTENDANCE</th>
                    <th style={{ padding: "14px 16px" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((w) => (
                    <tr
                      key={w._id || w.workerId}
                      style={{
                        borderBottom: "1px solid rgba(217, 119, 6, 0.12)",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 247, 237, 0.7)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#b45309" }}>{w.workerId}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#181e24" }}>{w.name}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>{w.designation || w.role}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>{w.department}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        <div>{w.shift} Shift</div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{w.zone}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background:
                              w.ppeStatus === "All PPE Verified"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                            color: w.ppeStatus === "All PPE Verified" ? "#047857" : "#b91c1c",
                          }}
                        >
                          {w.ppeStatus || "All PPE Verified"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            color:
                              w.riskLevel === "Critical" || w.riskLevel === "High"
                                ? "#dc2626"
                                : w.riskLevel === "Medium"
                                ? "#b45309"
                                : "#047857",
                            fontWeight: 700,
                          }}
                        >
                          {w.riskLevel || "Low"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{w.attendance || 95}%</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => toggleWorkerPPE(w)}
                          style={{
                            background: "#fffdfa",
                            border: "1px solid rgba(217, 119, 6, 0.35)",
                            color: "#b45309",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#d97706";
                            e.currentTarget.style.color = "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fffdfa";
                            e.currentTarget.style.color = "#b45309";
                          }}
                        >
                          Toggle PPE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal for Add Worker */}
            {showAddWorkerModal && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(24, 30, 36, 0.65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 200,
                  backdropFilter: "blur(6px)",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.35)",
                    borderRadius: "22px",
                    boxShadow: "0 25px 60px rgba(180, 83, 9, 0.15)",
                    padding: "30px",
                    width: "500px",
                    maxWidth: "92%",
                  }}
                >
                  <h3 style={{ margin: "0 0 18px", color: "#181e24", fontWeight: 800, fontSize: "18px" }}>
                    Register New Worker — ACDS Gold Mines
                  </h3>
                  <form onSubmit={handleAddWorkerSubmit} style={{ display: "grid", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <input
                        type="text"
                        placeholder="Worker ID (e.g. ACDS-W045)"
                        value={newWorker.workerId}
                        onChange={(e) => setNewWorker({ ...newWorker, workerId: e.target.value })}
                        required
                        style={{ padding: "10px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", color: "#181e24", borderRadius: "10px", fontSize: "12px" }}
                      />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newWorker.name}
                        onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                        required
                        style={{ padding: "10px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", color: "#181e24", borderRadius: "10px", fontSize: "12px" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <input
                        type="text"
                        placeholder="Designation (e.g. Drill Operator)"
                        value={newWorker.designation}
                        onChange={(e) => setNewWorker({ ...newWorker, designation: e.target.value })}
                        style={{ padding: "10px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", color: "#181e24", borderRadius: "10px", fontSize: "12px" }}
                      />
                      <input
                        type="text"
                        placeholder="Department (e.g. Ore Extraction)"
                        value={newWorker.department}
                        onChange={(e) => setNewWorker({ ...newWorker, department: e.target.value })}
                        style={{ padding: "10px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", color: "#181e24", borderRadius: "10px", fontSize: "12px" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <select
                        value={newWorker.shift}
                        onChange={(e) => setNewWorker({ ...newWorker, shift: e.target.value })}
                        style={{ padding: "10px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", color: "#181e24", borderRadius: "10px", fontSize: "12px" }}
                      >
                        <option value="Morning">Morning Shift</option>
                        <option value="Afternoon">Afternoon Shift</option>
                        <option value="Night">Night Shift</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Mining Zone (e.g. Gold Pit Alpha)"
                        value={newWorker.zone}
                        onChange={(e) => setNewWorker({ ...newWorker, zone: e.target.value })}
                        style={{ padding: "10px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", color: "#181e24", borderRadius: "10px", fontSize: "12px" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: "11px",
                          background: "linear-gradient(135deg, #d97706, #b45309)",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: 800,
                          fontSize: "12px",
                          color: "#ffffff",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
                        }}
                      >
                        Save Worker
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddWorkerModal(false)}
                        style={{
                          padding: "11px 20px",
                          background: "#fffdfa",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          borderRadius: "10px",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: HEAVY MINING EQUIPMENT & FLEET                     */}
        {/* ========================================================= */}
        {activeTab === "equipment" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div
              className="mg-pop"
              style={{
                background: "#ffffff",
                boxShadow: "0 6px 20px rgba(180, 83, 9, 0.06)",
                borderRadius: "18px",
                border: "1px solid rgba(217, 119, 6, 0.25)",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px" }}>⛏️</span>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "#181e24", fontWeight: 800 }}>
                    ACDS Gold Mines — Heavy Fleet & Mining Machinery Telemetry
                  </h2>
                </div>
                <p style={{ margin: 0, color: "#475569", fontSize: "12px" }}>
                  Open-Pit Ore Extraction Fleet • Live Fuel Levels, Operating Hours & Proactive Maintenance Status
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "rgba(217, 119, 6, 0.12)",
                    color: "#b45309",
                    padding: "6px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(217, 119, 6, 0.25)",
                  }}
                >
                  Active Fleet: {equipment.length} Units
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: equipment.filter((e) => e.fuelLevel < 25).length > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    color: equipment.filter((e) => e.fuelLevel < 25).length > 0 ? "#dc2626" : "#047857",
                    padding: "6px 12px",
                    borderRadius: "10px",
                    border: equipment.filter((e) => e.fuelLevel < 25).length > 0 ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  {equipment.filter((e) => e.fuelLevel < 25).length} Low Fuel Alert
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#047857",
                    padding: "6px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  Proactive Safety: DGMS Standard
                </span>
              </div>
            </div>

            {/* Equipment Grid Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {equipment.map((eq) => {
                // Determine Gold Mining machinery badge & icon
                const typeLower = (eq.equipmentType || "").toLowerCase();
                let icon = "🚜";
                let goldRole = "Gold Mining Machine";
                if (typeLower.includes("excavator")) {
                  icon = "⛏️";
                  goldRole = "Gold Ore Excavator";
                } else if (typeLower.includes("haul") || typeLower.includes("truck") || typeLower.includes("dump")) {
                  icon = "🚛";
                  goldRole = "240t Pit Haul Truck";
                } else if (typeLower.includes("load")) {
                  icon = "🚜";
                  goldRole = "Pit Wheel Loader";
                } else if (typeLower.includes("drill")) {
                  icon = "🔩";
                  goldRole = "Blast Hole Drill Rig";
                } else if (typeLower.includes("dozer")) {
                  icon = "🚜";
                  goldRole = "Crawler Stripping Dozer";
                } else if (typeLower.includes("crush")) {
                  icon = "⚙️";
                  goldRole = "Primary Gyratory Crusher";
                }

                const isOperational = eq.status === "Operational";
                const isInspectionDue = eq.maintenanceStatus === "Inspection Due" || eq.maintenanceStatus === "Service Overdue";

                return (
                  <div
                    key={eq._id || eq.equipmentId}
                    className="mg-pop"
                    style={{
                      background: "#ffffff",
                      boxShadow: "0 6px 20px rgba(180, 83, 9, 0.05)",
                      borderRadius: "16px",
                      border: "1px solid rgba(217, 119, 6, 0.22)",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Equipment Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "14px" }}>{icon}</span>
                            <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 800, letterSpacing: "0.5px" }}>
                              {eq.equipmentId} • {goldRole}
                            </span>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 800, color: "#181e24", marginTop: "3px" }}>
                            {eq.equipmentName}
                          </div>
                          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                            📍 {eq.currentLocation || "Extraction Pit"} {eq.assignedWorkerName ? `• 👷 ${eq.assignedWorkerName}` : ""}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "4px 9px",
                            borderRadius: "8px",
                            fontSize: "10px",
                            fontWeight: 800,
                            letterSpacing: "0.4px",
                            background: isOperational ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: isOperational ? "#047857" : "#dc2626",
                            border: isOperational ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(239, 68, 68, 0.25)",
                          }}
                        >
                          {eq.status || "Operational"}
                        </span>
                      </div>

                      {/* Fuel Tank Gauge & Refuel Required alert */}
                      <div style={{ margin: "14px 0 12px", background: "#fffdfa", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(217, 119, 6, 0.15)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginBottom: "6px" }}>
                          <span style={{ color: "#475569", fontWeight: 600 }}>⛽ Fuel Tank Level:</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {eq.fuelLevel < 40 && (
                              <span
                                style={{
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  padding: "1px 6px",
                                  borderRadius: "6px",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                }}
                              >
                                ⚠️ Refuel Required
                              </span>
                            )}
                            <span
                              style={{
                                fontWeight: 800,
                                color: eq.fuelLevel < 40 ? "#dc2626" : eq.fuelLevel < 60 ? "#d97706" : "#047857",
                              }}
                            >
                              {eq.fuelLevel}%
                            </span>
                          </div>
                        </div>
                        <div style={{ height: "7px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, Math.max(0, eq.fuelLevel))}%`,
                              background: eq.fuelLevel < 40 ? "#ef4444" : eq.fuelLevel < 60 ? "#f59e0b" : "#10b981",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>

                      {/* Operating Hours, Total Usage, Maintenance & Schedule */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          fontSize: "11px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            background: "#fffdfa",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(217, 119, 6, 0.12)",
                          }}
                        >
                          <div style={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                            Operating Hours
                          </div>
                          <div style={{ fontWeight: 800, color: "#181e24", fontSize: "12px", marginTop: "2px" }}>
                            ⏱️ {eq.operatingHours || 0} hrs
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                            Total Usage: {eq.totalUsageHours || ((eq.operatingHours || 0) + 1200)} hrs
                          </div>
                        </div>

                        <div
                          style={{
                            background: isInspectionDue ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: isInspectionDue ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)",
                          }}
                        >
                          <div style={{ color: isInspectionDue ? "#b45309" : "#047857", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                            Maintenance Status
                          </div>
                          <div
                            style={{
                              fontWeight: 800,
                              color: isInspectionDue ? "#b45309" : "#047857",
                              fontSize: "12px",
                              marginTop: "2px",
                            }}
                          >
                            🛠️ {eq.maintenanceStatus || "Healthy"}
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                            Next: {eq.nextMaintenanceDate || "2026-10-15"}
                          </div>
                        </div>
                      </div>

                      {/* Proactive Maintenance & Operator Details */}
                      <div
                        style={{
                          background: "#fffdfa",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid rgba(217, 119, 6, 0.12)",
                          fontSize: "11px",
                          marginBottom: "12px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                            Proactive Maintenance:
                          </span>
                          <span style={{ color: "#64748b", fontSize: "10px" }}>
                            Last: {eq.lastMaintenanceDate || "2026-09-18"}
                          </span>
                        </div>
                        <div style={{ color: "#181e24", fontWeight: 600, fontSize: "11px" }}>
                          🔧 {eq.proactiveMaintenance || "Hydraulic system & wear components verified"}
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "10px", color: "#b45309", fontWeight: 700 }}>
                          👷 Assigned Operator: {eq.assignedWorkerName || eq.operator || "Designated Heavy Fleet Pilot"}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleRefuelEquipment(eq)}
                        style={{
                          flex: 1,
                          background: "#fffdfa",
                          border: "1px solid rgba(217, 119, 6, 0.35)",
                          color: "#b45309",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#d97706";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fffdfa";
                          e.currentTarget.style.color = "#b45309";
                        }}
                      >
                        ⛽ Refuel Equipment (+40%)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ENVIRONMENTAL MONITORING                           */}
        {/* ========================================================= */}
        {activeTab === "environment" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div
              className="mg-pop"
              style={{
                background: "#ffffff",
                boxShadow: "0 6px 20px rgba(180, 83, 9, 0.06)",
                borderRadius: "18px",
                border: "1px solid rgba(217, 119, 6, 0.25)",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px" }}>🌱</span>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "#181e24", fontWeight: 800 }}>
                    ACDS Gold Mines — Atmospheric & Environmental Safety Index
                  </h2>
                </div>
                <p style={{ margin: 0, color: "#475569", fontSize: "12px" }}>
                  Continuous monitoring of PM2.5, PM10, Mine Gas, Water Runoff pH & Acoustic noise
                </p>
              </div>

              <span
                style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#047857",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 800,
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                ✓ DGMS & MoEFCC Gold Mine Environmental Norms Compliant
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div className="mg-pop" style={{ background: "#ffffff", boxShadow: "0 6px 20px rgba(180, 83, 9, 0.05)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(217, 119, 6, 0.22)" }}>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>AIR QUALITY INDEX (AQI)</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#047857", margin: "6px 0" }}>58</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>Good • Clean Underground Flow</div>
              </div>

              <div className="mg-pop" style={{ background: "#ffffff", boxShadow: "0 6px 20px rgba(180, 83, 9, 0.05)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(217, 119, 6, 0.22)" }}>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>PARTICULATE MATTER (PM2.5 / PM10)</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#0284c7", margin: "6px 0" }}>28 / 62</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>µg/m³ • Water Mist Suppression Active</div>
              </div>

              <div className="mg-pop" style={{ background: "#ffffff", boxShadow: "0 6px 20px rgba(180, 83, 9, 0.05)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(217, 119, 6, 0.22)" }}>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>PIT TEMPERATURE & HUMIDITY</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#d97706", margin: "6px 0" }}>27.4°C</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>Humidity: 64% RH • Thermal Comfort</div>
              </div>

              <div className="mg-pop" style={{ background: "#ffffff", boxShadow: "0 6px 20px rgba(180, 83, 9, 0.05)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(217, 119, 6, 0.22)" }}>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>MINE RUNOFF WATER pH</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#0d9488", margin: "6px 0" }}>7.2 pH</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>Neutral • Acid Drainage Free</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: COMPLIANCE & LEGAL DGMS                            */}
        {/* ========================================================= */}
        {activeTab === "compliance" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div
              className="mg-pop"
              style={{
                background: "#ffffff",
                boxShadow: "0 6px 20px rgba(180, 83, 9, 0.06)",
                borderRadius: "18px",
                border: "1px solid rgba(217, 119, 6, 0.25)",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px" }}>⚖️</span>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "#181e24", fontWeight: 800 }}>
                    ACDS Gold Mines — Statutory DGMS Compliance & Mining Leases
                  </h2>
                </div>
                <p style={{ margin: 0, color: "#475569", fontSize: "12px" }}>
                  Mining leases, blasting permits, air & water statutory approvals for gold extraction
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "rgba(217, 119, 6, 0.12)",
                    color: "#b45309",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(217, 119, 6, 0.25)",
                  }}
                >
                  Total Clearances: {compliance.length} Active
                </span>

                <button
                  onClick={() => setShowAddReportModal(true)}
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    color: "#181e24",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>📄</span>
                  <span>+ Add Protocol / Upload PDF Report</span>
                </button>
              </div>
            </div>

            {/* Section 12: STATUTORY DGMS COMPLIANCE REMINDERS */}
            <div
              className="mg-pop"
              style={{
                background: "linear-gradient(135deg, rgba(254, 243, 199, 0.75), rgba(255, 237, 213, 0.65))",
                borderRadius: "16px",
                border: "1px solid rgba(217, 119, 6, 0.3)",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "18px" }}>🔔</span>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#9a3412" }}>
                  DGMS Statutory Compliance Reminders & Regulatory Deadlines
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#b91c1c" }}>
                      ⚠️ DGMS Annual Blasting Safety Audit
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Due in 7 days — Review Required</div>
                  </div>
                  <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800 }}>URGENT</span>
                </div>

                <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#b45309" }}>
                      🛡️ Tailings Dam Stability Assessment
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Due in 12 days — Geotechnical Audit</div>
                  </div>
                  <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800 }}>PENDING</span>
                </div>

                <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#047857" }}>
                      🩺 Worker Respiratory Health Screening
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Due in 18 days — Shift A & B Med Review</div>
                  </div>
                  <span style={{ background: "#dcfce7", color: "#047857", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800 }}>SCHEDULED</span>
                </div>
              </div>
            </div>

            {/* Compliance Documents Table */}
            <div
              className="mg-pop"
              style={{
                background: "#ffffff",
                boxShadow: "0 6px 20px rgba(180, 83, 9, 0.05)",
                borderRadius: "18px",
                border: "1px solid rgba(217, 119, 6, 0.22)",
                overflowX: "auto",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(217, 119, 6, 0.20)", color: "#475569", background: "#fffdfa" }}>
                    <th style={{ padding: "14px 16px" }}>DOC ID</th>
                    <th style={{ padding: "14px 16px" }}>DOCUMENT TITLE</th>
                    <th style={{ padding: "14px 16px" }}>ISSUING AUTHORITY</th>
                    <th style={{ padding: "14px 16px" }}>EXPIRY DATE</th>
                    <th style={{ padding: "14px 16px" }}>DAYS LEFT</th>
                    <th style={{ padding: "14px 16px" }}>STATUS</th>
                    <th style={{ padding: "14px 16px" }}>PRIORITY</th>
                    <th style={{ padding: "14px 16px" }}>PDF ATTACHMENT</th>
                    <th style={{ padding: "14px 16px" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.map((cmp) => (
                    <tr
                      key={cmp._id || cmp.documentId}
                      style={{ borderBottom: "1px solid rgba(217, 119, 6, 0.10)", cursor: "pointer" }}
                      onClick={() => setSelectedPdfPreview(cmp)}
                    >
                      <td style={{ padding: "12px 16px", color: "#b45309", fontWeight: 800 }}>{cmp.documentId}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#181e24" }}>{cmp.documentName}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{cmp.issuingAuthority}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{cmp.expiryDate}</td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontWeight: 800,
                          color: cmp.daysToExpiry < 30 ? "#dc2626" : "#047857",
                        }}
                      >
                        {cmp.daysToExpiry} Days
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: 800,
                            background:
                              cmp.status === "Valid"
                                ? "rgba(16, 185, 129, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                            color: cmp.status === "Valid" ? "#047857" : "#dc2626",
                            border: cmp.status === "Valid" ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(239, 68, 68, 0.25)",
                          }}
                        >
                          {cmp.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            color:
                              cmp.priority === "Critical"
                                ? "#dc2626"
                                : cmp.priority === "High"
                                ? "#d97706"
                                : "#64748b",
                            fontWeight: 800,
                          }}
                        >
                          {cmp.priority}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#b45309", fontWeight: 600 }}>
                        📄 {cmp.fileName || `${(cmp.documentName || "Protocol").toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPdfPreview(cmp);
                          }}
                          style={{
                            background: "#fffdfa",
                            border: "1px solid rgba(217, 119, 6, 0.35)",
                            color: "#b45309",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          👁️ View PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal: Add Protocol / Upload PDF Report */}
            {showAddReportModal && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(24, 30, 36, 0.65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 200,
                  backdropFilter: "blur(6px)",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.35)",
                    borderRadius: "22px",
                    boxShadow: "0 25px 60px rgba(180, 83, 9, 0.15)",
                    padding: "28px",
                    width: "560px",
                    maxWidth: "92%",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>📄</span>
                      <h3 style={{ margin: 0, color: "#181e24", fontWeight: 800, fontSize: "17px" }}>
                        Add Protocol / Upload PDF Report
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowAddReportModal(false)}
                      style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const generatedId = `DGMS-2026-${Math.floor(100 + Math.random() * 900)}`;
                      const newDoc = {
                        _id: generatedId,
                        documentId: generatedId,
                        documentName: newReport.documentName || "Gold Extraction Protocol",
                        documentType: newReport.documentType,
                        issuingAuthority: newReport.issuingAuthority || "Directorate General of Mines Safety (DGMS)",
                        expiryDate: newReport.expiryDate || "2027-10-31",
                        daysToExpiry: 365,
                        status: "Valid",
                        priority: newReport.priority || "High",
                        fileName: newReport.fileName || `${(newReport.documentName || "Report").toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`,
                        remarks: newReport.remarks || "Uploaded and verified under DGMS statutory standards.",
                      };
                      setCompliance([newDoc, ...compliance]);
                      setShowAddReportModal(false);
                      setNewReport({
                        documentId: "",
                        documentName: "",
                        documentType: "Mine Safety Audit",
                        issuingAuthority: "Directorate General of Mines Safety (DGMS)",
                        reminderDays: 7,
                        status: "Review Required",
                        fileName: "",
                        remarks: "",
                      });
                      alert(`✓ Protocol & PDF Report [${newDoc.documentName}] uploaded successfully!\nDocument ID: ${generatedId}\nTotal active statutory clearances updated.`);
                    }}
                    style={{ display: "grid", gap: "12px" }}
                  >
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Document Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Annual Blasting Safety & Seismic Vibration Protocol"
                        value={newReport.documentName}
                        onChange={(e) => setNewReport({ ...newReport, documentName: e.target.value })}
                        required
                        style={{ width: "100%", padding: "9px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "8px", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Category / Type</label>
                        <select
                          value={newReport.documentType}
                          onChange={(e) => setNewReport({ ...newReport, documentType: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "8px", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                        >
                          <option value="Mine Safety Audit">Mine Safety Audit</option>
                          <option value="Blasting Protocol">Blasting Protocol</option>
                          <option value="Tailings Dam Stability">Tailings Dam Stability</option>
                          <option value="Environmental Clearance">Environmental Clearance</option>
                          <option value="Occupational Health">Occupational Health</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Compliance Authority</label>
                        <input
                          type="text"
                          placeholder="e.g. DGMS / MoEFCC"
                          value={newReport.issuingAuthority}
                          onChange={(e) => setNewReport({ ...newReport, issuingAuthority: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "8px", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Validity / Expiry Date</label>
                        <input
                          type="date"
                          value={newReport.expiryDate || "2027-10-31"}
                          onChange={(e) => setNewReport({ ...newReport, expiryDate: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "8px", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Priority</label>
                        <select
                          value={newReport.priority || "High"}
                          onChange={(e) => setNewReport({ ...newReport, priority: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "8px", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    {/* PDF Report File Picker */}
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>PDF Report File Picker *</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewReport((prev) => ({ ...prev, fileName: file.name }));
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          background: "#fffdfa",
                          border: "1px dashed rgba(217, 119, 6, 0.4)",
                          borderRadius: "8px",
                          fontSize: "11px",
                          marginTop: "4px",
                          boxSizing: "border-box",
                        }}
                      />
                      {newReport.fileName && (
                        <div style={{ fontSize: "11px", color: "#047857", fontWeight: 700, marginTop: "4px" }}>
                          ✓ Selected: {newReport.fileName}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>Description / Compliance Notes</label>
                      <textarea
                        rows="2"
                        placeholder="Regulatory reference, audit findings, DGMS circular notes..."
                        value={newReport.remarks}
                        onChange={(e) => setNewReport({ ...newReport, remarks: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", background: "#fffdfa", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "8px", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: "11px",
                          background: "linear-gradient(135deg, #d97706, #b45309)",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: 800,
                          fontSize: "12px",
                          color: "#ffffff",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
                        }}
                      >
                        Submit & Save Protocol
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddReportModal(false)}
                        style={{
                          padding: "11px 20px",
                          background: "#fffdfa",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          borderRadius: "10px",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Document Details & PDF Preview */}
            {selectedPdfPreview && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(24, 30, 36, 0.65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 200,
                  backdropFilter: "blur(6px)",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(217, 119, 6, 0.35)",
                    borderRadius: "22px",
                    boxShadow: "0 25px 60px rgba(180, 83, 9, 0.15)",
                    padding: "28px",
                    width: "600px",
                    maxWidth: "92%",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "22px" }}>📄</span>
                      <div>
                        <h3 style={{ margin: 0, color: "#181e24", fontWeight: 800, fontSize: "16px" }}>
                          {selectedPdfPreview.documentName}
                        </h3>
                        <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 700 }}>
                          Document ID: {selectedPdfPreview.documentId}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPdfPreview(null)}
                      style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Document Telemetry Grid */}
                  <div
                    style={{
                      background: "#fffdfa",
                      border: "1px solid rgba(217, 119, 6, 0.2)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      fontSize: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Issuing Authority</span>
                      <div style={{ fontWeight: 800, color: "#181e24" }}>{selectedPdfPreview.issuingAuthority}</div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Expiry Date / Status</span>
                      <div style={{ fontWeight: 800, color: selectedPdfPreview.daysToExpiry < 30 ? "#dc2626" : "#047857" }}>
                        {selectedPdfPreview.expiryDate} ({selectedPdfPreview.daysToExpiry} days left)
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Compliance Priority</span>
                      <div style={{ fontWeight: 800, color: selectedPdfPreview.priority === "Critical" ? "#dc2626" : "#b45309" }}>
                        {selectedPdfPreview.priority} Priority
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Uploaded File Status</span>
                      <div style={{ fontWeight: 800, color: "#047857" }}>
                        ✓ {selectedPdfPreview.fileName || `${(selectedPdfPreview.documentName || "doc").toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`}
                      </div>
                    </div>
                  </div>

                  {/* Simulated PDF Preview Box */}
                  <div
                    style={{
                      background: "#0f172a",
                      borderRadius: "12px",
                      padding: "20px",
                      color: "#f8fafc",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      lineHeight: 1.6,
                      border: "1px solid #334155",
                      marginBottom: "16px",
                      maxHeight: "180px",
                      overflowY: "auto",
                    }}
                  >
                    <div style={{ color: "#38bdf8", fontWeight: 800, borderBottom: "1px solid #334155", paddingBottom: "6px", marginBottom: "8px" }}>
                      [PDF VIEWER]: {selectedPdfPreview.fileName || "DGMS_Compliance_Doc.pdf"}
                    </div>
                    <div>MINISTRY OF LABOUR & EMPLOYMENT — DIRECTORATE GENERAL OF MINES SAFETY</div>
                    <div style={{ color: "#fbbf24" }}>Statutory Compliance Verification Seal: ACDS-GOLD-DGMS-VERIFIED</div>
                    <div style={{ marginTop: "6px" }}>
                      {selectedPdfPreview.remarks || "Certified that all mining operations, blast vibration damping, and atmospheric gas levels at ACDS Gold Mines conform with the statutory requirements under the Mines Act 1952 and Metalliferous Mines Regulations 1961."}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setSelectedPdfPreview(null)}
                      style={{
                        padding: "9px 20px",
                        background: "linear-gradient(135deg, #d97706, #b45309)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: AI MINING INTELLIGENCE                            */}
        {/* ========================================================= */}
        {activeTab === "ai" && (
          <MineBrainIntelligence
            workers={workers}
            equipment={equipment}
            environment={environment}
            compliance={compliance}
            hardwareData={hardwareData}
            aiData={aiData}
            isSimulatedMode={isSimulatedMode}
            webSerialConnected={webSerialConnected}
            serverOnline={serverOnline}
            onRefresh={fetchAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(217, 119, 6, 0.20)",
          background: "rgba(255, 253, 250, 0.98)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: "#64748b",
          zIndex: 20,
        }}
      >
        <div style={{ fontWeight: 600 }}>ACDS GOLD MINES INTELLIGENCE OS • ISO 45001 & DGMS COMPLIANT SMART GOLD MINING ARCHITECTURE</div>
        <div style={{ fontWeight: 600, color: "#b45309" }}>ACDS GOLD MINES · Live IoT Hardware Linked • DGMS Gold Mining Safety Active</div>
      </footer>
    </div>
  );
}

/**
 * MineGuard Centralized API Service
 * Communicates between React Frontend and Express Backend
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const error = new Error(errBody.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.details = errBody;
      throw error;
    }
    return await response.json();
  } catch (err) {
    console.warn(`[API] Error on ${options.method || "GET"} ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  baseUrl: API_BASE,

  // Health
  getHealth: () => request("/api/health"),

  // Workers / Workforce
  getWorkers: () => request("/api/workers"),
  createWorker: (data) => request("/api/workers", { method: "POST", body: JSON.stringify(data) }),
  updateWorker: (id, data) => request(`/api/workers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorker: (id) => request(`/api/workers/${id}`, { method: "DELETE" }),

  // Equipment & Fleet
  getEquipment: () => request("/api/equipment"),
  createEquipment: (data) => request("/api/equipment", { method: "POST", body: JSON.stringify(data) }),
  updateEquipment: (id, data) => request(`/api/equipment/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEquipment: (id) => request(`/api/equipment/${id}`, { method: "DELETE" }),

  // Inventory & Logistics
  getInventory: () => request("/api/inventory"),
  createInventory: (data) => request("/api/inventory", { method: "POST", body: JSON.stringify(data) }),
  updateInventory: (id, data) => request(`/api/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInventory: (id) => request(`/api/inventory/${id}`, { method: "DELETE" }),

  // Environmental Telemetry
  getEnvironment: () => request("/api/environment"),
  createEnvironment: (data) => request("/api/environment", { method: "POST", body: JSON.stringify(data) }),

  // Waste & Materials
  getWaste: () => request("/api/waste"),
  createWaste: (data) => request("/api/waste", { method: "POST", body: JSON.stringify(data) }),
  updateWaste: (id, data) => request(`/api/waste/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWaste: (id) => request(`/api/waste/${id}`, { method: "DELETE" }),

  // Finance & Cost Control
  getFinance: () => request("/api/finance"),
  createFinance: (data) => request("/api/finance", { method: "POST", body: JSON.stringify(data) }),

  // Statutory Compliance
  getCompliance: () => request("/api/compliance"),
  createCompliance: (data) => request("/api/compliance", { method: "POST", body: JSON.stringify(data) }),
  updateCompliance: (id, data) => request(`/api/compliance/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // AI Mining Risk Intelligence
  getAiIntelligence: () => request("/api/ai-intelligence"),

  // Hardware IoT: Flame, Gas, Ultrasonic & Buzzer
  getHardwareTelemetry: () => request("/api/hardware/telemetry"),
  sendHardwareTelemetry: (data) => request("/api/hardware/telemetry", { method: "POST", body: JSON.stringify(data) }),
  triggerBuzzer: (action = "TEST") => request("/api/hardware/buzzer", { method: "POST", body: JSON.stringify({ action }) }),
  getHardwareAlerts: () => request("/api/hardware/alerts"),

  // Biometric Face Registration
  registerFace: (data) => request("/api/register-face", { method: "POST", body: JSON.stringify(data) }),

  // Edge AI Emergency Routing & Smart Helmet / Watch
  getEdgeStatus: () => request("/api/edge/status"),
  getMineMap: () => request("/api/edge/map"),
  getWorkerRoute: (workerId = "W-104") => request(`/api/edge/route?workerId=${encodeURIComponent(workerId)}`),
  calculateRoute: (startNodeId, options = {}) =>
    request("/api/edge/route/calculate", { method: "POST", body: JSON.stringify({ startNodeId, options }) }),
  sendEdgeTelemetry: (data) => request("/api/edge/telemetry", { method: "POST", body: JSON.stringify(data) }),
  simulateScenario: (scenario) =>
    request("/api/edge/simulate-scenario", { method: "POST", body: JSON.stringify({ scenario }) }),
  resetSimulation: () => request("/api/edge/reset-simulation", { method: "POST" }),
  triggerSOS: (workerId = "W-104", details = "Manual panic trigger") =>
    request("/api/edge/sos", { method: "POST", body: JSON.stringify({ workerId, details }) }),
  acknowledgeSOS: (workerId = "W-104") =>
    request("/api/edge/sos/ack", { method: "POST", body: JSON.stringify({ workerId }) }),
  updateWorkerLocation: (workerId, nodeId) =>
    request("/api/edge/worker-location", { method: "POST", body: JSON.stringify({ workerId, nodeId }) }),
  getEdgeEvents: () => request("/api/edge/events"),

  // Roboflow AI PPE Detection (Helmet, Goggles, Mask)
  getPPEConfig: () => request("/api/ppe/config"),
  detectPPE: (data) => request("/api/ppe/detect", { method: "POST", body: JSON.stringify(data) }),
};

export default api;

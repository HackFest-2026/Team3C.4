# MINEGUARD — Edge AI + Smart Helmet + Smartwatch Emergency Routing Integration
**ACDS Gold Mines — Underground Mining Health & Safety Platform**

---

## 1. Project Overview & Objective

MineGuard is an edge computing-enabled mining health and safety system designed for underground gold extraction operations (ACDS Gold Mines Sector 4). This update integrates an **autonomous local Edge Emergency Intelligence core**, **graph-based dynamic evacuation route optimization**, **ESP32 smart helmet telemetry**, and a **wearable smartwatch emergency navigation HUD**.

### Critical Architecture Principles:
- **Zero Cloud Reliance:** All critical emergency detection, hazard evaluation, and evacuation route calculations execute locally without mandatory internet access.
- **Fail-Safe Route Verification:** Tunnels with offline or unmonitored sensors are marked `UNKNOWN` and flagged `SAFETY UNVERIFIED`. Hazardous or blocked tunnels are strictly excluded ($\text{cost} = \infty$).
- **Single Port Ownership:** The Python Sensor Collector (`hardware/collector.py`) acts as the exclusive owner of the ESP32 USB COM port, preventing serial conflicts with browser WebSerial.
- **Preserved Existing Features:** Full preservation of existing authentication, workforce tracking, DGMS compliance logs, heavy fleet tracking, environmental AQI, and 3D digital twin canvases.

---

## 2. Hardware Communication Architecture & Data Flow

```
+-----------------------------------------------------------------------------+
|                            UNDERGROUND MINE SITE                            |
+-----------------------------------------------------------------------------+
   [ESP32 Smart Helmet Node] (GPIO 4 Flame • GPIO 34 MQ-135 • HC-SR04 • Buzzer)
                            │
                            │ 115200 Baud USB Serial (JSON Telemetry)
                            ▼
   [Python Sensor Collector] (hardware/collector.py — Exclusive COM Port Owner)
                            │
                            │ Local HTTP POST (/api/edge/telemetry)
                            ▼
+-----------------------------------------------------------------------------+
|                     LOCAL EDGE COMPUTING NODE (Node.js)                     |
+-----------------------------------------------------------------------------+
   [Edge Intelligence Service] (Deterministic Hazard Engine & Watchdog)
                            │
                            │ Graph Traversal & Risk Penalties
                            ▼
   [RouteEngine (Dijkstra)] (Excludes Hazards • Turn-by-Turn • Target Exits)
                            │
                            ├───────────────────────────────┐
                            ▼                               ▼
   [Local Database / Memory Cache]           [Server-Sent Events / REST API]
   (MongoDB / In-Memory Resilience)          (/api/edge/* endpoints)
                            │                               │
                            ▼                               ▼
+-----------------------------------------------------------------------------+
|                           SURFACE SAFETY CONTROL                            |
+-----------------------------------------------------------------------------+
   [MineGuard Dashboard]                     [Smartwatch Evacuation HUD]
   (2D Interactive Tunnel Graph)             (AMOLED Wearable Guidance Preview)
```

---

## 3. Underground Mine Topology (Graph Network)

The underground mine is modeled as a connected graph $G = (V, E)$ in `server/config/mineTopology.js`:

### Nodes ($V$):
- **Surface Portals / Exits:**
  - `EXIT_ALPHA`: Surface Portal Alpha (East Heavy Vehicle Haulage Portal)
  - `EXIT_BRAVO`: Ventilation Adit Beta (West Fresh Air Intake / Personnel Egress)
  - `EXIT_CHARLIE`: Escape Shaft Charlie (Headframe Vertical Escape Hoist)
- **Subterranean Stations & Stopes:**
  - `SHAFT_MAIN`: Main Central Shaft Station
  - `JUNCTION_J1`: Junction J1 (West Crosscut)
  - `JUNCTION_J2`: Junction J2 (East Crosscut)
  - `JUNCTION_J3`: Junction J3 (Lower Stope Substation)
  - `WORK_FACE_A`: Extraction Face Alpha (Deep Lode — Active Stope)
  - `WORK_FACE_B`: Production Face Beta (Vein 7 South)
  - `REFUGE_BAY_1`: Pressurized Refuge Chamber #1 (96h Oxygen Safe Haven)

### Tunnels / Edges ($E$):
- `T1` (120m): `WORK_FACE_A` ↔ `JUNCTION_J1` (ESP32 Helmet Node)
- `T2` (95m): `JUNCTION_J1` ↔ `SHAFT_MAIN`
- `T3` (140m): `JUNCTION_J1` ↔ `EXIT_BRAVO`
- `T4` (160m): `WORK_FACE_A` ↔ `JUNCTION_J3` (Lower Bypass Ramp)
- `T5` (85m): `SHAFT_MAIN` ↔ `EXIT_CHARLIE`
- `T6` (95m): `SHAFT_MAIN` ↔ `JUNCTION_J2`
- `T7` (130m): `JUNCTION_J2` ↔ `EXIT_ALPHA`
- `T8` (110m): `WORK_FACE_B` ↔ `JUNCTION_J2`
- `T9` (150m): `JUNCTION_J3` ↔ `JUNCTION_J2`
- `T10` (45m): `JUNCTION_J3` ↔ `REFUGE_BAY_1`

---

## 4. Deterministic Hazard Detection & Routing Rules

1. **Fire Hazard:** Flame sensor Active LOW $\rightarrow$ Tunnel marked `HAZARDOUS` ($\text{cost} = \infty$).
2. **Toxic Gas / Methane:**
   - $< 180\text{ PPM}$: Normal air quality.
   - $180 - 320\text{ PPM}$: Warning $\rightarrow$ Tunnel marked `CAUTION` (+500 risk penalty).
   - $\ge 320\text{ PPM}$: Critical ceiling $\rightarrow$ Tunnel marked `HAZARDOUS` ($\text{cost} = \infty$).
3. **Tunnel Obstruction / Rockfall:** Ultrasonic clearance $< 25\text{ cm}$ $\rightarrow$ Tunnel marked `BLOCKED` ($\text{cost} = \infty$).
4. **Sensor Timeout / Stale Watchdog:** If telemetry stops for $> 12\text{ seconds}$, tunnel transitions to `UNKNOWN`. Routes traversing it are badged `SAFETY UNVERIFIED`.
5. **No Safe Route Policy:** When all egress paths to surface are compromised, system reports `NO VERIFIED SAFE ROUTE` and directs worker to the nearest pressurized `REFUGE_BAY_1` if reachable.

---

## 5. Demonstration & Test Scenarios (A through G)

The system includes an interactive Scenario Simulator accessible from the dashboard:

| Scenario | Key Trigger | Expected System Reaction |
| :--- | :--- | :--- |
| **A. Normal Operation** | All sensors clear | Shortest verified path via T1 $\rightarrow$ T3 to Exit Bravo (260m). Status: `VERIFIED SAFE`. |
| **B. Fire Emergency** | Flame detected in T2 | Tunnel T2 sealed ($\infty$). Reroutes through Shaft Main or Exit Bravo. |
| **C. Methane Spike** | Gas $\ge 320$ PPM in T1 | Tunnel T1 sealed. Directs Face A worker through Lower Bypass Ramp T4. |
| **D. Dynamic Reroute** | Rockfall blocks T3 mid-evacuation | Recalculates route instantly; smartwatch flashes `ROUTE CHANGED!` banner. |
| **E. Sensor Offline** | T3 telemetry lost ($>12$s) | Tunnel marked `UNKNOWN`. Route badged `SAFETY UNVERIFIED` with cautionary details. |
| **F. No Safe Route** | Both T1 & T4 compromised | Displays `NO VERIFIED SAFE ROUTE`. Prompts worker to engage self-rescuer and sound SOS. |
| **G. Local Offline Mode** | Simulates WAN internet severed | Demonstrates 100% autonomous route calculation and local logging without cloud. |

---

## 6. Installation & Run Instructions (Windows)

### Prerequisites:
- **Node.js** v18+ (tested on Node v24.14.0)
- **Python** 3.8+ (tested on Python 3.14.3)
- Optional: MongoDB running locally on `127.0.0.1:27017` (server operates gracefully in-memory if offline)

### Step 1: Install Dependencies
Open PowerShell and install dependencies for server and client:
```powershell
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
cd ..
```

### Step 2: Run Unit Tests
Verify route engine and edge intelligence logic:
```powershell
cd server
npm test
cd ..
```

### Step 3: Start the Edge Backend Server
```powershell
cd server
npm run dev
# Or: node server.js
```
*Backend runs on `http://localhost:5000` with Edge API mounted at `/api/edge`.*

### Step 4: Start the Frontend Client
In a second PowerShell window:
```powershell
cd client
npm run dev
```
*Client runs on `http://localhost:5173`.*

### Step 5: Start the Python USB Serial Collector
In a third PowerShell window:
```powershell
# If ESP32 is plugged in via USB (auto-detects COM port):
python hardware/collector.py

# Or if running without physical hardware (simulated demo stream):
python hardware/collector.py --demo
```

---

## 7. Roboflow AI PPE Detection Configuration

The Workforce & Safety section includes automated PPE verification powered by custom-trained Roboflow computer vision models:
- **Helmet Detection:** Verifies safety hard hat presence against falling rock hazards.
- **Safety Goggles Detection:** Verifies eye protection against drilling dust and fragments.
- **Safety Mask Detection:** Verifies respirator / dust mask compliance against respirable silica.

### Configuration (`server/.env`):
Add your trained Roboflow credentials securely to `server/.env`:
```env
ROBOFLOW_MODEL_URL=[PASTE MY ROBOFLOW MODEL URL HERE]
ROBOFLOW_API_KEY=[CONFIGURE MY ROBOFLOW API KEY SECURELY]
ROBOFLOW_VERSION=1
```

*Note: In unconfigured mode, the system never fabricates fake detections and clearly prompts for credentials. Once configured, live inference runs seamlessly over backend proxy endpoint `/api/ppe/detect` without exposing private API keys to the browser.*

---

## 8. Smart Helmet Wiring (ESP32)

| Module / Sensor | Pin | ESP32 GPIO | Function |
| :--- | :--- | :--- | :--- |
| **SSD1306 OLED** | SCL, SDA | GPIO 22, GPIO 21 | I2C display for evacuation HUD |
| **Flame Sensor** | Digital DO | GPIO 4 | Active LOW infrared flame detection |
| **MQ-135 Gas** | Analog AO | GPIO 34 | ADC1 analog air quality monitoring |
| **HC-SR04 Ultrasonic** | TRIG, ECHO | GPIO 5, GPIO 18 | Clearance & obstruction measurement |
| **Active Buzzer** | Positive (+) | GPIO 23 | Audible alarm siren |
| **SOS Push-Button** | Pin 1, Pin 2 | GPIO 13, GND | Optional manual distress switch (`INPUT_PULLUP`) |

*Flash code using Arduino IDE: `hardware/mineguard_esp32_firmware.ino`.*

---

## 8. Physical Smartwatch Integration Path

The included React smartwatch interface provides a realistic miner wearable preview. For real-world deployment on WearOS or Garmin hardware:
1. **Bluetooth Low Energy (BLE):** The ESP32 helmet node broadcasts BLE beacons with compact route bytes (`0x01: TURN_LEFT`, `0x02: EXIT_ALPHA`).
2. **Local Wi-Fi UDP Companion App:** A lightweight Android/WearOS APK listens on local mine Wi-Fi UDP port 5055 to receive emergency JSON packets.

---

## 9. Safety Disclaimer & Prototype Limitations

> **SAFETY NOTICE:**  
> This system is an academic / industrial IoT prototype demonstrating edge computing and graph-based dynamic routing algorithms. Real-world underground mine deployment requires explosion-proof intrinsically safe certification (DGMS / MSHA / ATEX Zone 0/1 compliance), redundant leaky-feeder mesh telemetry, and formal mine-safety engineering approvals.

# MineGuard Hardware Integration Guide & Wiring Schematic

This guide provides the complete hardware wiring, pin assignments, Arduino IDE configuration, and connection instructions for the **MineGuard Smart Helmet & Fire/Gas IoT Safety Node**.

---

## 1. Components Checklist

| Component | Description / Specification | Quantity | Purpose |
| :--- | :--- | :--- | :--- |
| **ESP32 Dev Board** | ESP32-WROOM-32 / NodeMCU ESP32 (30 or 38 pin) | 1 | Microcontroller running firmware |
| **Flame Sensor Module** | IR 3-pin or 4-pin Flame Detector (Digital Output `DO`) | 1 | Tunnel fire & ignition detection |
| **MQ-135 Gas Sensor** | Hazardous Gas & Air Quality sensor (NH3, Benzene, Alcohol, Smoke, CO2) | 1 | Toxic gas & explosive atmosphere check |
| **HC-SR04 Ultrasonic** | Ultrasonic Distance Sensor (4-pin: VCC, Trig, Echo, GND) | 1 | Tunnel clearance & rockfall obstruction |
| **SSD1306 OLED Display** | 0.96" I2C Monochrome Display (128x64 resolution, 4-pin) | 1 | Helmet HUD: worker ID, gas PPM, route directions |
| **Active Buzzer** | 5V / 3.3V Active Piezo Buzzer Module | 1 | Audible siren for worker emergency warning |
| **SOS Push-Button** *(Optional)* | Momentary tactile switch (Active LOW with internal pullup) | 1 | Manual distress beacon on helmet |
| **Breadboard / Prototype Board** | Standard 400 or 830 point solderless breadboard | 1 | Breadboarding / helmet mount |
| **Jumper Wires** | Female-to-Male and Male-to-Male jumper cables | 15–20 | Interconnections |
| **Micro-USB / Type-C Cable** | Data cable connecting ESP32 to Laptop USB Port | 1 | Serial telemetry & power |

---

## 2. Complete Pinout & Wiring Table

> **Note on Power Supply (VCC & GND):**  
> Connect the ESP32 `VIN` (5V from USB) or `3V3` to the positive power rail of the breadboard, and `GND` to the ground rail.

| Sensor / Module | Sensor Pin | ESP32 Pin | Wire Type | Purpose / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **SSD1306 OLED** | `VCC` | `3V3` (or 5V) | F-to-M | Power |
| | `GND` | `GND` | F-to-M | Ground |
| | `SCL` | `GPIO 22` | F-to-M | I2C Clock |
| | `SDA` | `GPIO 21` | F-to-M | I2C Data |
| **Flame Sensor** | `VCC` | `3V3` / `5V` | F-to-M | Power |
| | `GND` | `GND` | F-to-M | Ground |
| | `DO` (Digital Out) | `GPIO 4` | F-to-M | Active LOW on flame detection |
| **MQ-135 Gas** | `VCC` | `VIN` (5V) | F-to-M | Heater requires 5V |
| | `GND` | `GND` | F-to-M | Ground |
| | `AO` (Analog Out) | `GPIO 34` | F-to-M | ADC1 analog input (0 - 4095) |
| **MQ-4 Methane** | `VCC` | `VIN` (5V) | F-to-M | Methane sensor 5V power |
| | `GND` | `GND` | F-to-M | Ground |
| | `AO` (Analog Out) | `GPIO 35` | F-to-M | ADC1 analog input for methane ppm |
| **HC-SR04 Ultrasonic** | `VCC` | `VIN` (5V) | F-to-M | Power |
| | `GND` | `GND` | F-to-M | Ground |
| | `TRIG` | `GPIO 5` | F-to-M | Output pulse |
| | `ECHO` | `GPIO 18` | F-to-M | Input pulse |
| **Active Buzzer** | `+` (Positive / VCC) | `GPIO 23` | F-to-M | Driven HIGH for alarm siren |
| | `-` (Negative / GND) | `GND` | F-to-M | Ground |
| **SOS Button (Optional)**| `Leg 1` | `GPIO 13` | F-to-M | Input with `INPUT_PULLUP` |
| | `Leg 2` | `GND` | F-to-M | Ground (Shorts to GND when pressed) |

---

## 3. Hardware Communication Architecture

```
+---------------+        USB Serial       +--------------------------+
|  ESP32 Smart  |  ====================>  | Python Sensor Collector  |
| Helmet Node   |     115200 Baud         |  (hardware/collector.py) |
+---------------+                         +--------------------------+
       ^                                                |
       |  Serial Commands                               | Local HTTP POST
       |  (EVAC_CMD, BUZZER)                            v
+---------------+                         +--------------------------+
| OLED HUD &    |  <====================  | MineGuard Edge API       |
| Active Buzzer |                         | (Node.js Local Server)   |
+---------------+                         +--------------------------+
                                                        |
                                       +----------------+----------------+
                                       |                                 |
                                       v                                 v
                            +----------------------+          +----------------------+
                            | MineGuard Dashboard  |          | Smartwatch Evac HUD  |
                            | (React Frontend)     |          | (Wearable Interface) |
                            +----------------------+          +----------------------+
```

### Critical Port Ownership Rule:
The **Python Sensor Collector** (`hardware/collector.py`) acts as the single owner of the ESP32 USB serial port. The browser WebSerial and Python service must not compete for the same serial COM port.

---

## 4. How to Flash the Code via Arduino IDE

1. **Install Arduino IDE** (version 2.0 or newer).
2. Go to **File -> Preferences**, and paste this URL into **Additional Board Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Tools -> Board -> Boards Manager**, search for `ESP32` by Espressif and click **Install**.
4. Install Required Libraries via **Tools -> Manage Libraries**:
   - `Adafruit SSD1306` (by Adafruit)
   - `Adafruit GFX Library` (by Adafruit)
5. Select your Board: **Tools -> Board -> ESP32 Arduino -> DOIT ESP32 DEVKIT V1** (or ESP32 Dev Module).
6. Plug the USB cable into your laptop, and select the corresponding port under **Tools -> Port** (e.g. `COM3`, `COM4`).
7. Open `hardware/mineguard_esp32_firmware.ino` and click **Upload** (arrow icon).

---

## 5. Running the Python USB Serial Collector

1. Plug your flashed ESP32 into your laptop via USB cable.
2. In PowerShell or Command Prompt, run:
   ```powershell
   python hardware/collector.py --tunnel T2
   ```
   The script auto-detects the active ESP32 COM port, reads JSON telemetry, validates frames, and forwards them to `http://localhost:5000/api/edge/telemetry`.
3. **Physical Flame Test Workflow:**
   - Bring a safe test flame (e.g. lighter) near the flame sensor on GPIO 4.
   - The ESP32 triggers `flame_detected: true`.
   - The Python collector immediately logs:
     `🔥🔥🔥 [CRITICAL ALARM] REAL FIRE DETECTED BY SENSOR! 🔥🔥🔥`
   - The Edge engine isolates Tunnel T2 and reroutes worker W-104 safely.
   - The interactive mine map highlights Tunnel T2 with a red glow and 🔥 badge.
   - The Smartwatch HUD flashes `ROUTE CHANGED! NEW HAZARD DETECTED` and updates navigation.
   - A 15-second cooling verification window ensures the fire hazard is not cleared prematurely.
4. If no physical hardware is plugged in, test the collector in simulation mode:
   ```powershell
   python hardware/collector.py --demo --tunnel T2 --fire
   ```

---

## 6. Safety Logic & Deterministic Thresholds

- **Fire Detection:** Flame sensor triggers instantly when infrared radiation is detected. Buzzer sounds continuous siren, and Edge Route Engine flags the affected tunnel as `HAZARDOUS (FIRE)` (traversal weight = $\infty$).
- **Gas Detection (MQ-135):**
  - `< 180 PPM`: **Normal** (Clean underground atmosphere)
  - `180 - 320 PPM`: **Warning** (Ventilation alert; tunnel marked `CAUTION` with risk penalty)
  - `> 320 PPM`: **Critical Alert** (Explosive / toxic threshold exceeded; tunnel marked `HAZARDOUS`).
- **Proximity / Obstruction (HC-SR04):**
  - `< 25 cm`: Rockfall / collapse obstruction alert. Tunnel marked `BLOCKED` (traversal weight = $\infty$).
- **Sensor Stale / Offline Watchdog:**
  - If a sensor node ceases reporting for $> 12$ seconds, status transitions to `SENSOR OFFLINE` and the tunnel is marked `UNKNOWN` (Never `SAFE`). Any evacuation path using it is marked `SAFETY UNVERIFIED`.

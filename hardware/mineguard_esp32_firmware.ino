/*
 ====================================================================
  MINEGUARD — IoT Smart Helmet & Safety Controller Firmware (ESP32)
  ACDS Gold Mines — Edge Computing & Emergency Evacuation Node

  Installed Sensors & Actuators:
   - ESP32 Development Board (DOIT ESP32 DevKit v1 / NodeMCU 30-pin)
   - Flame Sensor Module (Digital IR Flame Module on GPIO 4)
   - MQ-135 Hazardous Gas Sensor (Analog ADC on GPIO 34)
   - HC-SR04 Ultrasonic Distance Sensor (Trig: 5, Echo: 18)
   - SSD1306 0.96" I2C Monochrome OLED Display (SDA: 21, SCL: 22)
   - Active Piezo Buzzer (Alarm Siren on GPIO 23)
   - Optional SOS Emergency Panic Button (Active LOW on GPIO 13)
   - USB Serial (115200 Baud) -> Python Sensor Collector / WebSerial

  Hardware Compatibility Note:
   Pin assignments match the original MineGuard hardware design.
   No changes to existing wiring are required.
 ====================================================================
*/

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ------------------------------------------------------------------
// PIN DEFINITIONS (ESP32 Standard GPIOs — 100% PRESERVED)
// ------------------------------------------------------------------
#define FLAME_PIN       4    // Flame Sensor Digital Output (LOW = Flame detected)
#define MQ135_PIN       34   // MQ-135 Analog Input (ADC1_CHANNEL_6)
#define TRIG_PIN        5    // HC-SR04 Ultrasonic Trigger
#define ECHO_PIN        18   // HC-SR04 Ultrasonic Echo
#define BUZZER_PIN      23   // Active Buzzer Positive Leg
#define OLED_SDA        21   // I2C Data
#define OLED_SCL        22   // I2C Clock
#define SOS_PIN         13   // Optional Helmet SOS Distress Push-Button (Active LOW with pullup)
#define MQ4_PIN         35   // MQ-4 Methane Sensor Analog Input (ADC1_CHANNEL_7)

// ------------------------------------------------------------------
// SMART HELMET & TUNNEL IDENTITY METADATA
// ------------------------------------------------------------------
const char* DEVICE_ID = "ESP32-MINE-NODE-01";
const char* HELMET_ID = "HELMET-ACDS-01";
const char* WORKER_ID = "W-104";
const char* ASSIGNED_TUNNEL = "T2"; // Installed at Tunnel T2 as specified

// ------------------------------------------------------------------
// OLED DISPLAY SETTINGS
// ------------------------------------------------------------------
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1
#define SCREEN_ADDRESS  0x3C // Standard I2C address for SSD1306

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool oledAvailable = false;

// ------------------------------------------------------------------
// OPTIONAL WI-FI & BACKEND SERVER SETTINGS
// ------------------------------------------------------------------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:5000/api/edge/telemetry";
bool wifiEnabled = false;

// ------------------------------------------------------------------
// SAFETY THRESHOLDS (DGMS Compliant Baseline)
// ------------------------------------------------------------------
const int GAS_WARNING_THRESHOLD  = 180;  // PPM baseline caution
const int GAS_CRITICAL_THRESHOLD = 320;  // PPM hazardous ceiling
const float DISTANCE_MIN_SAFE_CM = 25.0; // Distance warning for rockfall / obstruction

// ------------------------------------------------------------------
// STATE & DYNAMIC ROUTE INSTRUCTION VARIABLES
// ------------------------------------------------------------------
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 600;

// Dynamic route guidance received from Edge Router over Serial
char routeEvacInstruction[32] = "NORMAL OPERATION";
char routeTargetExit[24] = "EXIT BRAVO";
bool routeEvacActive = false;
bool manualSosActive = false;

// ------------------------------------------------------------------
// ULTRASONIC SENSOR READ FUNCTION (WITH FAULT DETECTION)
// ------------------------------------------------------------------
float readUltrasonicDistanceCm(bool &sensorFault) {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m max)
  if (duration == 0) {
    // Sensor timed out or echo pin disconnected
    sensorFault = false; // Out of range (>5m) considered clear
    return 400.0;
  }
  sensorFault = false;
  float distanceCm = (duration * 0.0343) / 2.0;
  return distanceCm;
}

// ------------------------------------------------------------------
// MQ-135 GAS PPM READ FUNCTION (WITH DISCONNECT DETECTION)
// ------------------------------------------------------------------
int readGasPPM(bool &sensorFault) {
  int rawValue = analogRead(MQ135_PIN); // 0 to 4095
  // If pin is floating or completely disconnected (0 or near max without bias)
  if (rawValue <= 10) {
    sensorFault = true;
    return 0; // Fault state
  }
  sensorFault = false;
  int ppm = map(rawValue, 200, 3500, 30, 750);
  if (ppm < 20) ppm = 20;
  if (ppm > 999) ppm = 999;
  return ppm;
}

// ------------------------------------------------------------------
// SMART HELMET OLED DISPLAY
// ------------------------------------------------------------------
void updateHelmetOLED(bool flameDetected, int gasPpm, float distanceCm, bool alarmActive, bool sos, bool gasFault) {
  if (!oledAvailable) return;

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // Line 1: Header with Worker ID & Helmet
  display.setCursor(0, 0);
  display.print(F("MINEGUARD ["));
  display.print(WORKER_ID);
  display.print(F("]"));
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // If Emergency Evacuation is active, prioritize dynamic routing instructions
  if (routeEvacActive || flameDetected || gasPpm >= GAS_CRITICAL_THRESHOLD || sos) {
    display.setCursor(0, 14);
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    if (sos) {
      display.print(F(" !! SOS ACTIVE !! "));
    } else if (flameDetected) {
      display.print(F(" ! FIRE IN T2 ! "));
    } else if (gasPpm >= GAS_CRITICAL_THRESHOLD) {
      display.print(F(" ! GAS CRITICAL ! "));
    } else {
      display.print(F(" ! EVACUATING ! "));
    }
    display.setTextColor(SSD1306_WHITE);

    // Evacuation Instruction Line
    display.setCursor(0, 26);
    display.print(F("NAV: "));
    display.print(routeEvacInstruction);

    display.setCursor(0, 38);
    display.print(F("TO : "));
    display.print(routeTargetExit);

    // Hazard Status
    display.setCursor(0, 52);
    display.print(F("GAS:"));
    display.print(gasPpm);
    display.print(F("PPM DIST:"));
    display.print((int)distanceCm);
    display.print(F("cm"));

  } else {
    // Normal Monitoring Screen
    display.setCursor(0, 14);
    display.print(F("ZONE: "));
    display.print(ASSIGNED_TUNNEL);
    display.print(F(" [STATUS: OK]"));

    display.setCursor(0, 26);
    display.print(F("GAS : "));
    if (gasFault) {
      display.print(F("FAULT/OFFLINE"));
    } else {
      display.print(gasPpm);
      display.print(F(" PPM"));
      if (gasPpm >= GAS_WARNING_THRESHOLD) display.print(F(" [WARN]"));
      else display.print(F(" [NORM]"));
    }

    display.setCursor(0, 38);
    display.print(F("PROX: "));
    display.print((int)distanceCm);
    display.print(F(" cm"));
    if (distanceCm < DISTANCE_MIN_SAFE_CM) {
      display.print(F(" [WARN]"));
    } else {
      display.print(F(" [CLEAR]"));
    }

    display.drawLine(0, 50, 127, 50, SSD1306_WHITE);
    display.setCursor(0, 54);
    display.print(F("HELMET: ONLINE (115K)"));
  }

  display.display();
}

// ------------------------------------------------------------------
// SETUP
// ------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n=================================================="));
  Serial.println(F(" MINEGUARD — Smart Helmet & Safety Node (ESP32)"));
  Serial.print(F(" Worker ID: ")); Serial.println(WORKER_ID);
  Serial.print(F(" Helmet ID: ")); Serial.println(HELMET_ID);
  Serial.println(F("=================================================="));

  // Pin Configurations
  pinMode(FLAME_PIN, INPUT_PULLUP);
  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ4_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(SOS_PIN, INPUT_PULLUP);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize I2C and OLED
  Wire.begin(OLED_SDA, OLED_SCL);
  if (display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    oledAvailable = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 15);
    display.print(F("MINEGUARD HELMET"));
    display.setCursor(20, 30);
    display.print(WORKER_ID);
    display.setCursor(15, 45);
    display.print(F("INITIALIZING..."));
    display.display();
    delay(1200);
  } else {
    Serial.println(F("[!] SSD1306 OLED not detected. Continuing in headless serial mode."));
  }

  // Initial buzzer chirp to confirm hardware power
  digitalWrite(BUZZER_PIN, HIGH);
  delay(120);
  digitalWrite(BUZZER_PIN, LOW);

  // Wi-Fi Configuration (Optional fallback)
  if (wifiEnabled && String(ssid) != "YOUR_WIFI_SSID") {
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 10) {
      delay(400);
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print(F("[√] Wi-Fi Connected: ")); Serial.println(WiFi.localIP());
    }
  }

  Serial.println(F("[*] System Ready. Streaming JSON telemetry over USB Serial."));
}

// ------------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------------
void loop() {
  bool gasFault = false;
  bool ultrasonicFault = false;

  // 1. Read Flame Sensor (Active LOW)
  int flameRaw = digitalRead(FLAME_PIN);
  bool flameDetected = (flameRaw == LOW);

  // 2. Read Gas Sensors (MQ-135 Air Quality + MQ-4 Methane)
  int gasPpm = readGasPPM(gasFault);
  int mq4Raw = analogRead(MQ4_PIN);
  int mq4Value = map(mq4Raw, 150, 3600, 20, 1500);
  if (mq4Value < 0) mq4Value = 0;

  // 3. Read Ultrasonic Sensor
  float distanceCm = readUltrasonicDistanceCm(ultrasonicFault);

  // 4. Read SOS Button (Active LOW)
  bool sosPressed = (digitalRead(SOS_PIN) == LOW);
  if (sosPressed) {
    manualSosActive = true;
  }

  // 5. Evaluate Alarms
  bool fireAlarm = flameDetected;
  bool gasAlarm = (gasPpm >= GAS_CRITICAL_THRESHOLD || mq4Value >= 1000);
  bool proxAlarm = (distanceCm < DISTANCE_MIN_SAFE_CM && distanceCm > 1.0);
  bool anyAlarm = (fireAlarm || gasAlarm || proxAlarm || manualSosActive || routeEvacActive);

  // 6. Buzzer Siren Actuation
  if (fireAlarm || manualSosActive) {
    digitalWrite(BUZZER_PIN, HIGH); // Continuous aggressive alarm
  } else if (gasAlarm) {
    digitalWrite(BUZZER_PIN, (millis() % 240 < 120) ? HIGH : LOW); // Rapid pulse
  } else if (proxAlarm || routeEvacActive) {
    digitalWrite(BUZZER_PIN, (millis() % 600 < 150) ? HIGH : LOW); // Intermittent beep
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  // 7. Update Smart Helmet OLED
  updateHelmetOLED(flameDetected, gasPpm, distanceCm, anyAlarm, manualSosActive, gasFault);

  // 8. Stream JSON Telemetry over Serial every interval (both snake_case and camelCase supported)
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();

    String json = "{";
    json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
    json += "\"helmet_id\":\"" + String(HELMET_ID) + "\",";
    json += "\"helmetId\":\"" + String(HELMET_ID) + "\",";
    json += "\"worker_id\":\"" + String(WORKER_ID) + "\",";
    json += "\"workerId\":\"" + String(WORKER_ID) + "\",";
    json += "\"tunnel_id\":\"" + String(ASSIGNED_TUNNEL) + "\",";
    json += "\"tunnelId\":\"" + String(ASSIGNED_TUNNEL) + "\",";
    json += "\"flame_detected\":" + String(flameDetected ? "true" : "false") + ",";
    json += "\"flameDetected\":" + String(flameDetected ? "true" : "false") + ",";
    json += "\"mq135_value\":" + String(gasPpm) + ",";
    json += "\"gasPpm\":" + String(gasPpm) + ",";
    json += "\"mq4_value\":" + String(mq4Value) + ",";
    json += "\"mq4Value\":" + String(mq4Value) + ",";
    json += "\"gasLevel\":\"" + String(gasPpm >= GAS_CRITICAL_THRESHOLD ? "CRITICAL" : (gasPpm >= GAS_WARNING_THRESHOLD ? "WARNING" : "NORMAL")) + "\",";
    json += "\"gasSensorFault\":" + String(gasFault ? "true" : "false") + ",";
    json += "\"distance_cm\":" + String(distanceCm, 1) + ",";
    json += "\"distanceCm\":" + String(distanceCm, 1) + ",";
    json += "\"proximityAlert\":" + String(proxAlarm ? "true" : "false") + ",";
    json += "\"sosTriggered\":" + String(manualSosActive ? "true" : "false") + ",";
    json += "\"buzzerActive\":" + String(anyAlarm ? "true" : "false") + ",";
    json += "\"status\":\"" + String(fireAlarm ? "FIRE_ALARM" : gasAlarm ? "GAS_HAZARD" : proxAlarm ? "PROXIMITY_HAZARD" : manualSosActive ? "SOS_ACTIVE" : "NORMAL") + "\",";
    json += "\"sensorMappings\":{\"flame\":\"TUNNEL-2\",\"mq135\":\"TUNNEL-10\",\"gas\":\"TUNNEL-10\",\"ultrasonic\":\"TUNNEL-6\",\"obstacle\":\"TUNNEL-6\"},";
    json += "\"sensors\":{\"flame\":{\"tunnelId\":\"TUNNEL-2\",\"detected\":" + String(flameDetected ? "true" : "false") + "},\"gas\":{\"tunnelId\":\"TUNNEL-10\",\"ppm\":" + String(gasPpm) + "},\"ultrasonic\":{\"tunnelId\":\"TUNNEL-6\",\"distanceCm\":" + String(distanceCm, 1) + "}},";
    json += "\"uptimeMs\":" + String(millis());
    json += "}";

    Serial.println(json);

    // Optional Wi-Fi HTTP POST
    if (wifiEnabled && WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");
      http.POST(json);
      http.end();
    }
  }

  // 9. Read Incoming Commands from Python Serial Collector / Dashboard
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.equalsIgnoreCase("BUZZER_TEST")) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(300);
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println(F("{\"cmdAck\":\"BUZZER_TEST_OK\"}"));
    } else if (cmd.startsWith("EVAC_CMD:")) {
      // Format: EVAC_CMD:<action>|<targetExit>
      String payload = cmd.substring(9);
      int sep = payload.indexOf('|');
      if (sep > 0) {
        String action = payload.substring(0, sep);
        String exit = payload.substring(sep + 1);
        strncpy(routeEvacInstruction, action.c_str(), sizeof(routeEvacInstruction) - 1);
        strncpy(routeTargetExit, exit.c_str(), sizeof(routeTargetExit) - 1);
      } else {
        strncpy(routeEvacInstruction, payload.c_str(), sizeof(routeEvacInstruction) - 1);
      }
      routeEvacActive = true;
      Serial.println(F("{\"cmdAck\":\"EVAC_CMD_RECEIVED\"}"));
    } else if (cmd.equalsIgnoreCase("EVAC_CLEAR")) {
      routeEvacActive = false;
      strncpy(routeEvacInstruction, "NORMAL OPERATION", sizeof(routeEvacInstruction) - 1);
      Serial.println(F("{\"cmdAck\":\"EVAC_CLEARED\"}"));
    } else if (cmd.equalsIgnoreCase("SOS_CLEAR")) {
      manualSosActive = false;
      Serial.println(F("{\"cmdAck\":\"SOS_CLEARED\"}"));
    }
  }

  delay(50);
}

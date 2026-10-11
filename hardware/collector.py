#!/usr/bin/env python3
"""
=============================================================================
MINEGUARD — Edge AI Python USB Serial Sensor Collector
=============================================================================
Hardware Communication Architecture:
ESP32 Firmware -> USB Serial -> Python Sensor Collector -> Local HTTP API
-> MongoDB -> MineGuard Backend -> Frontend Dashboard / Smartwatch

Acts as the SINGLE OWNER of the ESP32 USB Serial COM port to prevent device
lock conflicts with browser WebSerial.

Dependencies:
  - Python 3.8+ (uses built-in urllib.request, json, time, sys, argparse)
  - pyserial (pip install pyserial)
=============================================================================
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.error

try:
    import serial
    import serial.tools.list_ports
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False


DEFAULT_BAUD = 115200
DEFAULT_API_URL = "http://localhost:5000/api/edge/telemetry"
DEFAULT_HW_API_URL = "http://localhost:5000/api/hardware/telemetry"
DEFAULT_TUNNEL = "T2"
POLL_DELAY_SECS = 0.5


def list_serial_ports():
    """List available COM / tty ports."""
    if not HAS_PYSERIAL:
        print("[!] Warning: 'pyserial' is not installed. Run: pip install pyserial")
        return []
    ports = list(serial.tools.list_ports.comports())
    return [p.device for p in ports]


def normalize_telemetry(payload, assigned_tunnel=DEFAULT_TUNNEL):
    """
    Standardize telemetry payload to include both snake_case and camelCase
    conventions expected by firmware, edge engine, and legacy hardware APIs.
    """
    device_id = payload.get("device_id") or payload.get("deviceId") or "ESP32-MINE-NODE-01"
    tunnel_id = payload.get("tunnel_id") or payload.get("tunnelId") or assigned_tunnel

    raw_flame = payload.get("flame_detected") if "flame_detected" in payload else payload.get("flameDetected", False)
    if isinstance(raw_flame, str):
        flame_detected = raw_flame.lower() in ("true", "1", "yes")
    else:
        flame_detected = bool(raw_flame)

    mq135_val = payload.get("mq135_value") if "mq135_value" in payload else payload.get("gasPpm", 60)
    try:
        gas_ppm = int(float(mq135_val))
    except Exception:
        gas_ppm = 60

    mq4_val = payload.get("mq4_value") if "mq4_value" in payload else payload.get("mq4Value", None)

    dist_val = payload.get("distance_cm") if "distance_cm" in payload else payload.get("distanceCm", 150.0)
    try:
        distance_cm = round(float(dist_val), 1)
    except Exception:
        distance_cm = 150.0

    normalized = {
        "device_id": device_id,
        "deviceId": device_id,
        "tunnel_id": tunnel_id,
        "tunnelId": tunnel_id,
        "flame_detected": flame_detected,
        "flameDetected": flame_detected,
        "mq135_value": gas_ppm,
        "gasPpm": gas_ppm,
        "distance_cm": distance_cm,
        "distanceCm": distance_cm,
        "worker_id": payload.get("worker_id") or payload.get("workerId") or "W-104",
        "workerId": payload.get("workerId") or payload.get("worker_id") or "W-104",
        "isSimulated": bool(payload.get("isSimulated", False)),
        "timestamp": payload.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "collectorSource": payload.get("collectorSource", "Python-USB-Serial"),
        "sensorMappings": {
            "flame": "TUNNEL-2",
            "mq135": "TUNNEL-10",
            "gas": "TUNNEL-10",
            "ultrasonic": "TUNNEL-6",
            "obstacle": "TUNNEL-6",
        },
        "sensors": {
            "flame": {
                "tunnelId": "TUNNEL-2",
                "detected": flame_detected,
            },
            "gas": {
                "tunnelId": "TUNNEL-10",
                "ppm": gas_ppm,
            },
            "ultrasonic": {
                "tunnelId": "TUNNEL-6",
                "distanceCm": distance_cm,
            },
        },
    }

    if mq4_val is not None:
        normalized["mq4_value"] = mq4_val
        normalized["mq4Value"] = mq4_val

    return normalized


def send_to_local_edge(telemetry_data, api_url):
    """
    Post sensor payload to the local MineGuard Edge API.
    Uses standard library urllib to guarantee zero external HTTP dependencies.
    """
    try:
        print("[API] Sensor event received")
        payload_bytes = json.dumps(telemetry_data).encode("utf-8")
        req = urllib.request.Request(
            api_url,
            data=payload_bytes,
            headers={"Content-Type": "application/json", "User-Agent": "MineGuard-Edge-Collector/2.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status == 200:
                body = resp.read().decode("utf-8")
                print("[API] Sensor event saved successfully")
                return json.loads(body)
            else:
                print(f"[ERROR] Sensor API request failed: HTTP {resp.status}")
                return {"error": f"HTTP {resp.status}"}
    except urllib.error.URLError as e:
        print(f"[ERROR] Sensor API request failed: {e.reason}")
        return {"error": f"Connection to Edge API failed: {e.reason}"}
    except Exception as e:
        print(f"[ERROR] Sensor API request failed: {e}")
        return {"error": str(e)}


def run_simulated_collector(api_url, interval=1.0, tunnel=DEFAULT_TUNNEL, inject_fire=False, inject_gas=False, inject_obstacle=False, inject_multi=False):
    """
    Simulation mode when physical ESP32 is not connected.
    Allows testing full Python -> Edge API -> Frontend pipeline with multi-sensor hazard options.
    """
    print("=" * 70)
    print("  MINEGUARD EDGE SENSOR COLLECTOR — MULTI-SENSOR SIMULATION MODE")
    print(f"  Target Local API: {api_url}")
    print(f"  Fixed Mappings  : T2 (Flame), T10 (MQ-135 Gas), T6 (HC-SR04 Obstacle)")
    if inject_multi:
        print("  Multi-Hazard    : ACTIVATED (Simultaneous T2 Fire, T10 Gas, T6 Obstacle)")
    elif inject_fire:
        print("  Simulated Hazard: FLAME ON TUNNEL T2 (IR Flame Detector)")
    elif inject_gas:
        print("  Simulated Hazard: TOXIC GAS ON TUNNEL T10 (MQ-135 > 320 PPM)")
    elif inject_obstacle:
        print("  Simulated Hazard: ROCKFALL ON TUNNEL T6 (HC-SR04 < 25cm)")
    print("  Press Ctrl+C to stop simulation.")
    print("=" * 70)

    tick = 0
    worker_id = "W-104"
    device_id = "ESP32-MINE-NODE-01"

    while True:
        tick += 1

        # Sensor 1: Flame on T2
        flame = bool(inject_multi or inject_fire)

        # Sensor 2: MQ-135 Gas on T10
        if inject_multi or inject_gas:
            gas_ppm = 450 + (tick % 25)
        else:
            gas_ppm = 75 + (tick % 15)

        # Sensor 3: HC-SR04 Obstacle on T6
        if inject_multi or inject_obstacle:
            dist_cm = 14.0 + (tick % 5) * 0.5
        else:
            dist_cm = 145.0 + (tick % 20)

        raw_payload = {
            "device_id": device_id,
            "tunnel_id": tunnel,
            "worker_id": worker_id,
            "flame_detected": flame,
            "mq135_value": gas_ppm,
            "distance_cm": round(dist_cm, 1),
            "isSimulated": False,  # Treated as physical IoT data for autonomous local edge routing
            "collectorSource": "Python-Collector-MultiSensor",
        }

        telemetry = normalize_telemetry(raw_payload, assigned_tunnel=tunnel)

        tags = []
        if flame:
            tags.append("🔥 T2 FIRE")
        if gas_ppm >= 320:
            tags.append(f"💨 T10 GAS ({gas_ppm} PPM)")
        if dist_cm < 25.0:
            tags.append(f"⛔ T6 OBSTACLE ({dist_cm:.1f}cm)")
        status_tag = " | ".join(tags) if tags else "✓ ALL TUNNELS NORMAL"

        print(f"\n[SIM #{tick:04d}] [{status_tag}]")
        print(f"[SENSOR] Flame sensor reading received: {flame}")
        print(f"[SENSOR] Gas sensor reading received: {gas_ppm} PPM")
        print(f"[SENSOR] Ultrasonic distance received: {dist_cm:.1f} cm")
        print(f"[SENSOR] Assigned tunnel: TUNNEL-2 / TUNNEL-10 / TUNNEL-6")
        edge_resp = send_to_local_edge(telemetry, api_url)

        # Forward to legacy hardware endpoint as well
        send_to_local_edge(telemetry, DEFAULT_HW_API_URL)

        if "error" in edge_resp:
            print(f"  [x] Edge API Status: {edge_resp['error']}")
        else:
            route = edge_resp.get("route", {})
            h_cmd = edge_resp.get("helmetCommand", {})
            route_status = route.get("routeStatus", "UNKNOWN")
            next_action = h_cmd.get("nextAction", "NORMAL")
            target_exit = h_cmd.get("targetExit", "N/A")
            print(f"  [√] Edge Route Status : {route_status}")
            print(f"  [√] Evacuation Directive: {next_action} -> Target: {target_exit}")

        time.sleep(interval)


def run_serial_collector(port, baud, api_url, tunnel=DEFAULT_TUNNEL):
    """
    Live USB Serial port reader connecting to physical ESP32.
    """
    if not HAS_PYSERIAL:
        print("[!] Error: 'pyserial' is required for physical COM port reading.")
        print("    Install it using: pip install pyserial")
        sys.exit(1)

    print("=" * 70)
    print("  MINEGUARD EDGE SENSOR COLLECTOR — LIVE USB SERIAL")
    print(f"  COM Port       : {port} @ {baud} baud")
    print(f"  Sensor Nodes   : Fixed Hardware Mapping [T2: Flame, T10: Gas, T6: Obstacle]")
    print(f"  Edge API URL   : {api_url}")
    print("  Ownership      : EXCLUSIVE OWNER OF USB PORT (WebSerial is bypassed)")
    print("=" * 70)

    prev_flame = False
    prev_gas_crit = False
    prev_obs = False

    while True:
        try:
            print(f"\n[*] Connecting to ESP32 on port '{port}'...")
            ser = serial.Serial(port, baud, timeout=2.0)
            print(f"[√] Serial Port '{port}' connected successfully!")
            print("[*] Streaming telemetry to local MineGuard Edge Intelligence...\n")

            while True:
                line = ser.readline().decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                if not (line.startswith("{") and line.endswith("}")):
                    print(f"  [ESP32 LOG] {line}")
                    continue

                try:
                    raw_payload = json.loads(line)
                except json.JSONDecodeError:
                    print(f"  [ERROR] Sensor data parsing failed: {line}")
                    continue

                payload = normalize_telemetry(raw_payload, assigned_tunnel=tunnel)
                flame = payload["flameDetected"]
                device_id = payload["deviceId"]
                gas = payload["gasPpm"]
                dist = payload["distanceCm"]

                print(f"[SENSOR] Flame sensor reading received: {flame}")
                print(f"[SENSOR] Gas sensor reading received: {gas} PPM")
                print(f"[SENSOR] Ultrasonic distance received: {dist} cm")
                print(f"[SENSOR] Assigned tunnel: TUNNEL-2 / TUNNEL-10 / TUNNEL-6")

                gas_crit = gas >= 320
                obs_crit = dist < 25.0 and dist >= 1.0

                # Highlight state changes across all 3 sensors
                if flame and not prev_flame:
                    print("\n" + "=" * 70)
                    print(f"  🔥🔥🔥 [CRITICAL ALARM] REAL FIRE DETECTED BY SENSOR AT TUNNEL T2! 🔥🔥🔥")
                    print(f"  Device ID     : {device_id}")
                    print(f"  Action        : Rerouting all miners away from Tunnel T2...")
                    print("=" * 70 + "\n")
                elif not flame and prev_flame:
                    print("\n" + "=" * 70)
                    print(f"  ❄️  Flame cleared on Tunnel T2. 15s cooling verification active.")
                    print("=" * 70 + "\n")

                if gas_crit and not prev_gas_crit:
                    print("\n" + "=" * 70)
                    print(f"  💨💨💨 [CRITICAL ALARM] HAZARDOUS GAS DETECTED BY MQ-135 AT TUNNEL T10! ({gas} PPM)")
                    print(f"  Action        : Tunnel T10 sealed. Evacuation routes rerouted...")
                    print("=" * 70 + "\n")
                elif not gas_crit and prev_gas_crit:
                    print(f"\n[*] Gas cleared below threshold in Tunnel T10 ({gas} PPM). Ventilation window active.\n")

                if obs_crit and not prev_obs:
                    print("\n" + "=" * 70)
                    print(f"  ⛔⛔⛔ [CRITICAL ALARM] ROCKFALL OBSTRUCTION IN TUNNEL T6! ({dist:.1f}cm < 25cm)")
                    print(f"  Action        : Tunnel T6 blocked. Recalculating safest path...")
                    print("=" * 70 + "\n")
                elif not obs_crit and prev_obs:
                    print(f"\n[*] Clearance restored in Tunnel T6 ({dist:.1f}cm).\n")

                prev_flame = flame
                prev_gas_crit = gas_crit
                prev_obs = obs_crit

                # Forward to Edge Intelligence API
                edge_resp = send_to_local_edge(payload, api_url)

                # Also forward to hardware endpoint for legacy dashboard compatibility
                send_to_local_edge(payload, DEFAULT_HW_API_URL)

                tag = "🔥 FIRE" if flame else ("💨 GAS" if gas_crit else ("⛔ BLOCKED" if obs_crit else "NORMAL"))
                print(f"[{tag}] T2 Flame: {flame} | T10 Gas: {gas} PPM | T6 Dist: {dist}cm", end="")

                if "error" in edge_resp:
                    print(f" -> [Edge API: {edge_resp['error']}]")
                else:
                    route = edge_resp.get("route", {})
                    h_cmd = edge_resp.get("helmetCommand", {})
                    r_status = route.get("routeStatus", "UNKNOWN")
                    action = h_cmd.get("nextAction", "NORMAL")
                    print(f" -> [{r_status}] Next: {action}")

                    # If Edge indicates buzzer or route command, write instruction back to ESP32!
                    if h_cmd.get("buzzerAlert"):
                        try:
                            ser.write(b"BUZZER_TEST\n")
                        except Exception:
                            pass

                time.sleep(0.05)

        except serial.SerialException as e:
            print(f"[!] Serial Error on '{port}': {e}")
            print("[*] Reconnecting in 3 seconds... (Ensure ESP32 is plugged in)")
            time.sleep(3.0)
        except KeyboardInterrupt:
            print("\n[*] Exiting MineGuard Edge Serial Collector. Goodbye!")
            try:
                ser.close()
            except Exception:
                pass
            sys.exit(0)


def main():
    parser = argparse.ArgumentParser(description="MineGuard Edge USB Serial Sensor Collector")
    parser.add_argument("--port", "-p", help="Serial COM port (e.g. COM3, COM4, /dev/ttyUSB0)")
    parser.add_argument("--baud", "-b", type=int, default=DEFAULT_BAUD, help=f"Baud rate (default: {DEFAULT_BAUD})")
    parser.add_argument("--url", "-u", default=DEFAULT_API_URL, help=f"Local Edge API URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--tunnel", "-t", default=DEFAULT_TUNNEL, help=f"Assigned Tunnel ID (default: {DEFAULT_TUNNEL})")
    parser.add_argument("--demo", "-d", action="store_true", help="Run simulated telemetry generator")
    parser.add_argument("--fire", action="store_true", help="Inject simulated fire hazard at Tunnel T2")
    parser.add_argument("--gas", action="store_true", help="Inject simulated critical gas hazard (>320 PPM) at Tunnel T10")
    parser.add_argument("--obstacle", action="store_true", help="Inject simulated rockfall blockage (<25cm) at Tunnel T6")
    parser.add_argument("--multi", action="store_true", help="Inject all 3 hazards simultaneously (T2 Fire, T10 Gas, T6 Obstacle)")
    parser.add_argument("--interval", "-i", type=float, default=1.0, help="Simulation loop interval in seconds")

    args = parser.parse_args()

    if args.demo or args.fire or args.gas or args.obstacle or args.multi:
        run_simulated_collector(
            args.url,
            interval=args.interval,
            tunnel=args.tunnel,
            inject_fire=args.fire,
            inject_gas=args.gas,
            inject_obstacle=args.obstacle,
            inject_multi=args.multi,
        )
        return

    # If no port specified, discover ports
    port = args.port
    if not port:
        available_ports = list_serial_ports()
        if not available_ports:
            print("[!] No USB Serial ports detected!")
            print("    Options:")
            print("    1. Plug in your ESP32 board via USB cable.")
            print(f"    2. Or run simulation demo: python hardware/collector.py --demo")
            print(f"    3. Or test specific hazard: python hardware/collector.py --fire (or --gas, --obstacle, --multi)")
            sys.exit(1)
        elif len(available_ports) == 1:
            port = available_ports[0]
            print(f"[*] Auto-detected serial port: {port}")
        else:
            print("[*] Multiple serial ports found:")
            for idx, p in enumerate(available_ports):
                print(f"    {idx + 1}. {p}")
            port = available_ports[0]
            print(f"[*] Selecting first port: {port} (Use --port to override)")

    run_serial_collector(port, args.baud, args.url, tunnel=args.tunnel)


if __name__ == "__main__":
    main()

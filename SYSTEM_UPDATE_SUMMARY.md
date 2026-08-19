# Homely Smart Home — Comprehensive System Updates & Architecture

## Overview
This document details the enhancements made to the **Homely Smart Home** ESP32 firmware and React Native mobile application, covering dynamic Wi-Fi setup, zero-latency network communication, UI simplification, 3-pin enclosure status LEDs, local database persistence, and CSV log export.

---

## 1. ESP32 Firmware Enhancements (`smart_home_firmware.ino`)

### Dynamic Wi-Fi & Captive Portal (No Hardcoded Credentials)
- **Automatic Setup Hotspot**: If the device has no saved credentials (or cannot reach the saved home Wi-Fi), it automatically starts an Access Point: `Homely-SmartHome-Setup`.
- **Embedded Web Setup Portal (`192.168.4.1`)**: Displays an automatic captive portal with a 2.4 GHz network scanner and password input.
- **Non-Volatile Flash Storage (NVS)**: Uses the ESP32 `Preferences` library to save the SSID and password permanently.
- **Factory Reset Endpoint**: Added `/reset-wifi` endpoint to clear credentials when needed.

### 7-LED Live Hardware Status Dashboard (Common Anode, Single Resistor Hack)
Turns the 7-LED PCB board into a complete real-time hardware status panel. Connect the single common positive (+) leg to ESP32 **3.3V** via a single 220Ω resistor, and connect the 7 negative ground legs to individual GPIO pins (**Active-LOW: LOW = ON, HIGH = OFF**):

| LED # | Label | Real-Time Function | ESP32 GPIO Pin |
|:---:|:---|:---|:---:|
| **1** | `LED_WIFI` | Wi-Fi Status (Solid = Online, Fast Blink = Connecting, Slow Pulse = Setup) | **GPIO 18** |
| **2** | `LED_MODE` | System Mode (Lit ON = Auto Mode, OFF = Manual Mode) | **GPIO 19** |
| **3** | `LED_PORCH` | Porch Light Relay State (Mirrors Relay) | **GPIO 21** |
| **4** | `LED_LIVING` | Living Room Light Relay State (Mirrors Relay) | **GPIO 22** |
| **5** | `LED_BED_L` | Bedroom Light Relay State (Mirrors Relay) | **GPIO 23** |
| **6** | `LED_BED_F` | Bedroom Fan Relay State (Mirrors Relay) | **GPIO 27** |
| **7** | `LED_MOTION` | PIR Motion Detection (Flashes ON when motion is detected) | **GPIO 13** |
| **+** | **Common Anode** | **Common Positive (+) Leg via single 220Ω resistor** | **3.3V Pin** |

*(The onboard DevKit LED on **GPIO 2** also mirrors the Wi-Fi state for bench testing).*

### Zero-Latency Communication & Single-Roundtrip Payload
- **Atomic Telemetry Payload**: Consolidated `/status` to return all relay states + temperature + humidity + motion in a **single JSON payload**, eliminating TCP socket starvation on the single-threaded ESP32 web server.
- **Disabled Modem Sleep**: Added `WiFi.setSleep(false);` on connection to reduce ping latency from ~400ms to **<5ms**.
- **CORS Support**: Added `Access-Control-Allow-Origin: *` and `OPTIONS` preflight handlers across all endpoints.
- **Default Mode & Pin Allocation**:
  - `systemMode` defaults to **`"manual"`**.
  - Enhanced `handleMode()` to synchronize mode updates from the mobile app in real time.
  - Pin assignments: Porch Relay = `26`, Living Room Relay = `32`, Bedroom Light Relay = `33`, Bedroom Fan Relay = `25`, PIR = `4`, DHT11 = `17`.

---

## 2. React Native App Enhancements

### App-Wide UI Clarity & Jargon Elimination
- **Room Cards & Subtitles**: Replaced electrical/relay terminology (`Relay CH2`, `PIR Motion • 3 LEDs Ceiling Wash`, `Parallel Load`) with intuitive descriptors (`Motion-activated lighting`, `Climate controlled`, `Manual control`).
- **Home Screen (`HomeScreen.tsx`)**: Replaced `DHT11 BEDROOM CLIMATE` with **`Bedroom Climate`**, `PIR MOTION/IDLE` with **`Motion/Idle`**, and renamed section to **`Rooms`**.
- **Rooms Screen (`RoomsScreen.tsx`)**: Renamed title from `Zones & Hardware` to **`My Home`**.
- **Room Detail Screen (`RoomDetailScreen.tsx`)**: Replaced raw relay badges with functional **`AUTO`** / **`MANUAL`** mode pills.
- **Background Image Centering**: Calibrated `ROOM_IMG_OFFSET` values so all room card images center on their key visual subject (bed, sofa/fireplace, porch seating) rather than top-cropping to the ceiling/sky.

### Dedicated Setup Guide (`SetupGuideScreen.tsx`)
- Created a 4-step visual setup guide with responsive card layouts.
- Explains the setup hotspot, `192.168.4.1` portal, and mDNS discovery (`homely-smarthome.local`).
- Features a **7-LED Status Dashboard Reference Table**.

### Settings Screen (`SettingsScreen.tsx`)
- Placed the **"How to Connect & Setup"** guide button at the top.
- Real-time **Connection Status Banner** (green/red with last update time) and **Test & Connect** button.
- **System Mode Selector**: Choosing Manual or Auto dispatches `POST /mode` to sync the ESP32 in real time.
- Removed the About section for a clean, focused settings interface.

### Local Database Persistence & CSV Export (`useHomeStore.ts` & `ActivityScreen.tsx`)
- **Offline Persistence**: Integrated `@react-native-async-storage/async-storage` with Zustand's `persist` middleware. All activity logs, manual IP entries, and mode preferences are saved permanently to the phone's internal storage and survive app closures.
- **CSV Export Engine**: Added an **`Export CSV`** button generating RFC 4180 standard CSV files (`ID, Date, Time, Timestamp, Room, Event, Details`) with native system share sheet integration (`expo-file-system` + `expo-sharing`).
- Added a **Clear Logs** option with a confirmation prompt.

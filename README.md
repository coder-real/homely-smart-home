# Homely

Mobile app that controls a home automation system built on an ESP32. The ESP32 runs relays for porch lights, living room LEDs, a bedroom light, and a ceiling fan. A PIR sensor handles motion-activated lighting in auto mode. A DHT11 sensor reads temperature and humidity, and the fan kicks in automatically when it gets too warm.

The app connects to the ESP32 over local Wi-Fi, shows real-time sensor data, and lets you toggle devices manually.

## Running it

```bash
npm install
npx expo start --android
```

Needs an ESP32 on the same Wi-Fi network running the firmware (`smart_home_firmware.ino`). The app tries to find it at `homely-smarthome.local` (mDNS), or you can enter the ESP32's IP address in Settings.

If you don't have the ESP32 yet, the app will just show "Offline" — no simulation mode.

## How it works

**Auto mode** — PIR motion sensor controls the living room lights. Motion at the entrance turns them on, 5 seconds of no motion turns them off. The bedroom fan turns on when temperature hits 28°C and off when it drops to 26.5°C (hysteresis to prevent rapid toggling). Porch light is always manual.

**Manual mode** — everything controlled from the app. The PIR and temperature thresholds are ignored.

The app polls `GET /status` every 1.5 seconds. Toggles fire a `POST /relay/{channel}` with optimistic UI — the switch flips instantly, the ESP32 confirms in the background. If it fails, the switch reverts.

## Project structure

```
src/
├── api/esp32.ts              HTTP client — discovery, polling, relay/mode commands
├── hooks/
│   ├── usePolling.ts         Auto-discovers ESP32, polls on foreground, stops on background
│   └── useRoomToggle.ts      Optimistic toggle + POST + rollback on failure
├── screens/
│   ├── HomeScreen.tsx        Sensor widget, room cards with background images, recent activity
│   ├── RoomsScreen.tsx       Room grid
│   ├── RoomDetailScreen.tsx  Per-room controls (light, fan, target temp, mode)
│   ├── ActivityScreen.tsx    Full activity log with CSV export
│   ├── SettingsScreen.tsx    Connection status, mode selector, IP fallback, setup guide link
│   └── SetupGuideScreen.tsx  Visual guide for first-time ESP32 setup
├── navigation/
│   ├── RootNavigator.tsx     Stack: tabs + room detail
│   └── BottomTabs.tsx        Home, Rooms, Activity, Settings
├── store/
│   └── useHomeStore.ts       Zustand — rooms, sensors, motion, mode, activity log (persisted)
└── theme.ts                  Colors, spacing, type scale
```

## ESP32 firmware

`smart_home_firmware.ino` — runs on ESP32 with:

- 4 relay channels (porch, living room, bedroom light, bedroom fan)
- PIR motion sensor on living room entrance
- DHT11 temperature/humidity sensor in bedroom
- Dynamic Wi-Fi setup via captive portal (no hardcoded credentials)
- mDNS as `homely-smarthome.local`
- CORS headers for browser testing
- 3 status LEDs (amber = setup, blue = connecting, green = online)
- NVS storage for Wi-Fi credentials (survives reboots)
- Factory reset endpoint (`POST /reset-wifi`)

## Hardware

ESP32, 4-channel relay module (active-LOW), DHT11, PIR motion sensor, 10kΩ pull-ups on each relay IN pin, separate 12V supply for loads via 7805 for logic. Pin map:

| Component | GPIO |
|---|---|
| PIR | 4 |
| DHT11 | 17 |
| Relay — Porch | 26 |
| Relay — Living Room | 32 |
| Relay — Bedroom Light | 33 |
| Relay — Bedroom Fan | 25 |
| Status LED — Amber | 18 |
| Status LED — Blue | 19 |
| Status LED — Green | 21 |
| Onboard LED | 2 |

## What's done

- [x] Breadboard prototyping — all hardware validated
- [x] Firmware with debounce, hysteresis, safe boot defaults, captive portal setup
- [x] App with real-time polling, optimistic toggles, CSV export, offline persistence
- [x] mDNS discovery with IP fallback
- [ ] Cardboard house enclosure with LED strips and wiring
- [ ] Remote access (not needed for MVP)

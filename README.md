# Smart Home

React Native app that controls an ESP32-based home automation system. Renders a 3D isometric house using Three.js where rooms light up in real time as devices toggle on and off. Talks to the ESP32 over a local REST API.

Currently runs in simulation mode — the app works standalone without hardware, simulating PIR motion events and sensor readings so the UI and 3D scene can be developed and tested independently.

## Running it

```bash
npm install
npx expo start --android
```

Opens in Expo Go on a physical Android device or emulator. No ESP32 needed — simulation mode is on by default.

## How it works

The app has two modes:

**Auto mode** — the ESP32's PIR motion sensor controls everything. Motion detected → porch light and living room LED turn on. No motion for5 seconds → they turn off. The app displays status but doesn't accept manual input.

**Manual mode** — the PIR sensor is ignored. You toggle devices directly from the app. Tapping a room in the list flips its relay on the ESP32, and the3D house updates to match.

When connected to a real ESP32, the app polls `/status` and `/sensors` every4 seconds. In simulation mode, a hook generates fake motion events on the same timing.

## Project structure

```
src/
├── api/esp32.ts           REST client — GET /sensors, GET /status, POST /relay, POST /mode
├── components/
│   ├── House3D.tsx        Three.js scene — orthographic isometric camera, room lights, glow planes
│   ├── TopBar.tsx         Auto/Manual toggle, connection dot, PIR badge
│   ├── SensorCards.tsx    Temperature, humidity, motion indicator
│   ├── DeviceControls.tsx Room switches (disabled in auto mode)
│   └── ActivityLog.tsx    Timestamped event feed
├── hooks/
│   └── useSimulation.ts   Fake PIR events + sensor fluctuation for demo
├── store/
│   └── useHomeStore.ts    Zustand — rooms, mode, sensors, activity log
└── theme.ts               Colors, spacing, type scale
```

## ESP32 endpoints the app expects

| Method | Path | Returns / Accepts |
|---|---|---|
| GET | `/sensors` | `{ temperature, humidity }` |
| GET | `/status` | `{ motion, motor, led, mode }` |
| POST | `/relay/{channel}` | `{ "state": "on" \| "off" }` — channel is `motor`, `porch`, or `living` |
| POST | `/mode` | `{ "mode": "auto" \| "manual" }` |

The ESP32 firmware for these endpoints isn't written yet. The app hits them when an IP is configured; until then, simulation covers the UI.

## Hardware (breadboard-validated)

ESP32, DHT11, PIR motion sensor, active-LOW relay module,5V DC motor with flyback diode, separate motor power supply with shared ground,10kΩ pull-up on relay IN pin. Full details and lessons learned are in `home_automation_full_scope.md`.

## What's done

- [x] Breadboard prototyping — all hardware validated
- [x] Firmware with debounce, separate power supplies, safe boot defaults
- [x] App scaffold — Three.js house, UI, state management, simulation mode
- [ ] ESP32 Wi-Fi + REST endpoints
- [ ] App connected to real ESP32
- [ ] Cardboard house build with LED strips and wiring
- [ ] Remote access (maybe later, not needed for MVP)

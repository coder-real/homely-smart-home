# 🏠 Smart Home — ESP32 Home Automation App

A Tesla-inspired smart home control app built with React Native, Expo, and Three.js. Controls an ESP32-based home automation system with PIR motion detection, temperature/humidity monitoring, and relay-controlled devices.

## Features

- **3D Isometric House** — Real-time Three.js visualization with room lighting that responds to device state
- **Auto / Manual Mode** — PIR sensor controls devices automatically, or take manual control from the app
- **Live Sensors** — Temperature and humidity readings from DHT11 sensor
- **Motion Detection** — PIR motion status with visual indicators
- **Device Control** — Toggle living room LED, bedroom fan, and porch light
- **Activity Log** — Real-time event stream with timestamps

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57 |
| Language | TypeScript |
| 3D Engine | Three.js + expo-gl + expo-three |
| State | Zustand |
| Animations | React Native Reanimated |
| Haptics | expo-haptics |

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on Android
npx expo start --android
```

## Project Structure

```
src/
├── api/
│   └── esp32.ts          # REST API client for ESP32
├── components/
│   ├── ActivityLog.tsx    # Event log feed
│   ├── DeviceControls.tsx # Room toggle switches
│   ├── House3D.tsx        # Three.js house scene
│   ├── SensorCards.tsx    # Temperature + humidity display
│   └── TopBar.tsx         # Mode toggle + connection status
├── hooks/
│   └── useSimulation.ts   # Demo mode (no ESP32 needed)
├── store/
│   └── useHomeStore.ts    # Zustand global state
└── theme.ts               # Colors, spacing, typography
```

## ESP32 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/status` | Motion, motor, LED state |
| GET | `/sensors` | Temperature + humidity |
| POST | `/relay/{channel}` | Toggle device on/off |
| POST | `/mode` | Switch auto/manual mode |

## Hardware

- ESP32 dev board
- DHT11 temperature/humidity sensor
- PIR motion sensor
- Relay module (active-LOW)
- 5V DC motor
- LED strips (living room, porch)

## Build Phases

- [x] Breadboard prototyping
- [x] Firmware with debounce/safety logic
- [x] Mobile app scaffold with 3D house
- [ ] Wi-Fi + REST API on ESP32
- [ ] Connect app to real ESP32
- [ ] Move circuit into cardboard house
- [ ] Remote access (optional)

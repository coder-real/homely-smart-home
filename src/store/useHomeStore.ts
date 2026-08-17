import { create } from 'zustand';

export type RoomId = 'living' | 'bedroom' | 'porch';
export type Mode = 'auto' | 'manual';
export type RoomMode = 'auto' | 'manual';

export interface RoomState {
  id: RoomId;
  name: string;
  subtitle: string;
  icon: string;
  isOn: boolean; // Main light/power
  fanOn?: boolean; // For bedroom fan (Relay CH4)
  fanSpeed?: 'Off' | 'Low' | 'Medium' | 'High';
  targetTemp?: number; // Target temperature for DHT11 fan trigger
  mode: RoomMode;
  temperature?: number;
  humidity?: number;
  relayChannel: string;
  ledCount?: number;
}

export interface ActivityEntry {
  id: string;
  message: string;
  subtitle: string;
  color: string;
  timestamp: number;
  roomId?: RoomId;
}

interface HomeState {
  // Mode
  mode: Mode;
  defaultMode: Mode;

  // Rooms
  rooms: Record<RoomId, RoomState>;

  // Sensors
  temperature: number; // DHT11 Bedroom ambient
  humidity: number;    // DHT11 Bedroom humidity
  lastUpdated: number;

  // Motion (PIR - Living Room Entrance)
  motionDetected: boolean;
  lastMotion: number | null;

  // ESP32 connection
  esp32Ip: string;
  isConnected: boolean;

  // Activity log
  activityLog: ActivityEntry[];

  // Actions
  setMode: (mode: Mode) => void;
  setDefaultMode: (mode: Mode) => void;
  toggleRoom: (roomId: RoomId) => void;
  setRoomState: (roomId: RoomId, isOn: boolean) => void;
  setBedroomFan: (fanOn: boolean, fanSpeed?: 'Off' | 'Low' | 'Medium' | 'High') => void;
  setTargetTemp: (temp: number) => void;
  setRoomMode: (roomId: RoomId, mode: RoomMode) => void;
  setSensors: (temp: number, humidity: number) => void;
  setMotionDetected: (detected: boolean) => void;
  setEsp32Ip: (ip: string) => void;
  setConnected: (connected: boolean) => void;
  addLogEntry: (message: string, subtitle: string, color: string, roomId?: RoomId) => void;
}

let logIdCounter = 0;

export const useHomeStore = create<HomeState>((set, get) => ({
  mode: 'auto',
  defaultMode: 'auto',

  rooms: {
    living: {
      id: 'living',
      name: 'Living Room',
      subtitle: 'PIR Motion • 3 LEDs Ceiling Wash',
      icon: 'tv',
      isOn: false,
      mode: 'auto',
      relayChannel: 'CH2',
      ledCount: 3,
    },
    bedroom: {
      id: 'bedroom',
      name: 'Bedroom',
      subtitle: 'Master Suite • 1 LED + Fan',
      icon: 'moon',
      isOn: false,
      fanOn: false,
      fanSpeed: 'Off',
      targetTemp: 24.0,
      mode: 'auto',
      temperature: 22.4,
      humidity: 58,
      relayChannel: 'CH3 / CH4',
      ledCount: 1,
    },
    porch: {
      id: 'porch',
      name: 'Porch',
      subtitle: 'Manual Only • 1 LED Sconce',
      icon: 'sun',
      isOn: false,
      mode: 'manual',
      relayChannel: 'CH1',
      ledCount: 1,
    },
  },

  temperature: 24.2,
  humidity: 62,
  lastUpdated: Date.now(),
  motionDetected: false,
  lastMotion: null,
  esp32Ip: '192.168.1.42',
  isConnected: false,
  activityLog: [
    {
      id: 'seed-1',
      message: 'Living Room lights turned ON',
      subtitle: 'PIR motion detected at entrance (CH2)',
      color: '#10B981',
      timestamp: Date.now() - 1000 * 60 * 2,
      roomId: 'living',
    },
    {
      id: 'seed-2',
      message: 'Bedroom Fan set to Low',
      subtitle: 'DHT11 Temp reached 24.2°C (CH4)',
      color: '#38BDF8',
      timestamp: Date.now() - 1000 * 60 * 15,
      roomId: 'bedroom',
    },
    {
      id: 'seed-3',
      message: 'Porch light turned OFF',
      subtitle: 'Manual override (CH1)',
      color: '#F59E0B',
      timestamp: Date.now() - 1000 * 60 * 45,
      roomId: 'porch',
    },
  ],

  setMode: (mode) => {
    set({ mode });
    get().addLogEntry(
      mode === 'auto' ? 'System switched to Auto' : 'System switched to Manual',
      mode === 'auto' ? 'PIR controls Living, DHT11 controls Fan' : 'Direct app override',
      mode === 'auto' ? '#3B82F6' : '#F59E0B'
    );
  },

  setDefaultMode: (defaultMode) => set({ defaultMode }),

  toggleRoom: (roomId) => {
    const state = get();
    const room = state.rooms[roomId];
    const newIsOn = !room.isOn;
    set({
      rooms: {
        ...state.rooms,
        [roomId]: { ...room, isOn: newIsOn },
      },
    });
    get().addLogEntry(
      `${room.name} light ${newIsOn ? 'ON' : 'OFF'}`,
      `Relay ${room.relayChannel.split(' ')[0]} • Manual override`,
      newIsOn ? '#10B981' : 'rgba(255,255,255,0.4)',
      roomId
    );
  },

  setRoomState: (roomId, isOn) => {
    const state = get();
    const room = state.rooms[roomId];
    set({
      rooms: {
        ...state.rooms,
        [roomId]: { ...room, isOn },
      },
    });
  },

  setBedroomFan: (fanOn, fanSpeed) => {
    const state = get();
    const bedroom = state.rooms.bedroom;
    const speed = fanSpeed ?? (fanOn ? 'Low' : 'Off');
    set({
      rooms: {
        ...state.rooms,
        bedroom: {
          ...bedroom,
          fanOn,
          fanSpeed: speed,
        },
      },
    });
    get().addLogEntry(
      `Bedroom Fan ${fanOn ? 'turned ON' : 'turned OFF'}`,
      fanOn ? `Relay CH4 • Speed ${speed}` : 'Relay CH4 • Stopped',
      fanOn ? '#38BDF8' : 'rgba(255,255,255,0.4)',
      'bedroom'
    );
  },

  setTargetTemp: (targetTemp) => {
    const state = get();
    const bedroom = state.rooms.bedroom;
    set({
      rooms: {
        ...state.rooms,
        bedroom: { ...bedroom, targetTemp },
      },
    });
  },

  setRoomMode: (roomId, mode) => {
    const state = get();
    const room = state.rooms[roomId];
    set({
      rooms: {
        ...state.rooms,
        [roomId]: { ...room, mode },
      },
    });
  },

  setSensors: (temperature, humidity) =>
    set((state) => {
      const isBedroomAuto = state.mode === 'auto' || state.rooms.bedroom.mode === 'auto';
      const target = state.rooms.bedroom.targetTemp ?? 24.0;
      const shouldFanRun = temperature >= target;
      
      let updatedBedroom = state.rooms.bedroom;
      if (isBedroomAuto && shouldFanRun !== updatedBedroom.fanOn) {
        updatedBedroom = {
          ...updatedBedroom,
          fanOn: shouldFanRun,
          fanSpeed: shouldFanRun ? 'Low' : 'Off',
        };
      }

      return {
        temperature,
        humidity,
        lastUpdated: Date.now(),
        rooms: {
          ...state.rooms,
          bedroom: {
            ...updatedBedroom,
            temperature,
            humidity,
          },
        },
      };
    }),

  setMotionDetected: (motionDetected) =>
    set({ motionDetected, lastMotion: motionDetected ? Date.now() : get().lastMotion }),

  setEsp32Ip: (esp32Ip) => set({ esp32Ip }),

  setConnected: (isConnected) => set({ isConnected }),

  addLogEntry: (message, subtitle, color, roomId) => {
    const entry: ActivityEntry = {
      id: String(++logIdCounter),
      message,
      subtitle,
      color,
      timestamp: Date.now(),
      roomId,
    };
    set((state) => ({
      activityLog: [entry, ...state.activityLog].slice(0, 100),
    }));
  },
}));

import { create } from 'zustand';

export type RoomId = 'living' | 'bedroom' | 'porch';
export type Mode = 'auto' | 'manual';

export interface RoomState {
  id: RoomId;
  name: string;
  subtitle: string;
  icon: string;
  isOn: boolean;
}

export interface ActivityEntry {
  id: string;
  message: string;
  color: string;
  timestamp: number;
}

interface HomeState {
  // Mode
  mode: Mode;

  // Rooms
  rooms: Record<RoomId, RoomState>;

  // Sensors
  temperature: number;
  humidity: number;

  // Motion
  motionDetected: boolean;

  // ESP32 connection
  esp32Ip: string;
  isConnected: boolean;

  // Activity log
  activityLog: ActivityEntry[];

  // Actions
  setMode: (mode: Mode) => void;
  toggleRoom: (roomId: RoomId) => void;
  setRoomState: (roomId: RoomId, isOn: boolean) => void;
  setSensors: (temp: number, humidity: number) => void;
  setMotionDetected: (detected: boolean) => void;
  setEsp32Ip: (ip: string) => void;
  setConnected: (connected: boolean) => void;
  addLogEntry: (message: string, color: string) => void;
}

let logIdCounter = 0;

export const useHomeStore = create<HomeState>((set, get) => ({
  mode: 'auto',

  rooms: {
    living: {
      id: 'living',
      name: 'Living Room',
      subtitle: 'LED Strip',
      icon: '💡',
      isOn: false,
    },
    bedroom: {
      id: 'bedroom',
      name: 'Bedroom',
      subtitle: 'Fan + Light',
      icon: '🌀',
      isOn: false,
    },
    porch: {
      id: 'porch',
      name: 'Porch',
      subtitle: 'Light',
      icon: '🔆',
      isOn: false,
    },
  },

  temperature: 24.3,
  humidity: 62,
  motionDetected: false,
  esp32Ip: '',
  isConnected: false,
  activityLog: [],

  setMode: (mode) => {
    set({ mode });
    get().addLogEntry(
      mode === 'auto'
        ? 'Switched to Auto (PIR control)'
        : 'Switched to Manual (app control)',
      mode === 'auto' ? '#3B82F6' : '#F59E0B'
    );
  },

  toggleRoom: (roomId) => {
    const state = get();
    if (state.mode === 'auto') return;
    const room = state.rooms[roomId];
    const newIsOn = !room.isOn;
    set({
      rooms: {
        ...state.rooms,
        [roomId]: { ...room, isOn: newIsOn },
      },
    });
    get().addLogEntry(
      `${room.name} ${newIsOn ? 'ON' : 'OFF'}`,
      newIsOn ? '#22C55E' : 'rgba(255,255,255,0.4)'
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

  setSensors: (temperature, humidity) => set({ temperature, humidity }),

  setMotionDetected: (motionDetected) => set({ motionDetected }),

  setEsp32Ip: (esp32Ip) => set({ esp32Ip }),

  setConnected: (isConnected) => set({ isConnected }),

  addLogEntry: (message, color) => {
    const entry: ActivityEntry = {
      id: String(++logIdCounter),
      message,
      color,
      timestamp: Date.now(),
    };
    set((state) => ({
      activityLog: [entry, ...state.activityLog].slice(0, 50),
    }));
  },
}));

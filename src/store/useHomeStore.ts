import { create } from 'zustand';

export type RoomId = 'living' | 'bedroom' | 'porch';
export type Mode = 'auto' | 'manual';
export type RoomMode = 'auto' | 'manual';

export interface RoomState {
  id: RoomId;
  name: string;
  subtitle: string;
  icon: string;
  isOn: boolean;
  mode: RoomMode;
  temperature?: number;
  humidity?: number;
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
  temperature: number;
  humidity: number;
  lastUpdated: number;

  // Motion
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
      subtitle: 'Auto follows motion sensor',
      icon: '💡',
      isOn: false,
      mode: 'auto',
      temperature: 22,
      humidity: 60,
    },
    bedroom: {
      id: 'bedroom',
      name: 'Bedroom',
      subtitle: 'Master Suite',
      icon: '🌀',
      isOn: false,
      mode: 'manual',
      temperature: 22.4,
      humidity: 55,
    },
    porch: {
      id: 'porch',
      name: 'Porch',
      subtitle: 'Manual only',
      icon: '🔆',
      isOn: false,
      mode: 'manual',
      temperature: 28,
      humidity: 71,
    },
  },

  temperature: 30.6,
  humidity: 71,
  lastUpdated: Date.now(),
  motionDetected: false,
  lastMotion: null,
  esp32Ip: '192.168.1.42',
  isConnected: false,
  activityLog: [
    {
      id: 'seed-1',
      message: 'Living Room turned on',
      subtitle: 'Motion detected',
      color: '#34D399',
      timestamp: Date.now() - 1000 * 60 * 3,
      roomId: 'living',
    },
    {
      id: 'seed-2',
      message: 'Porch light turned off',
      subtitle: 'Manual override',
      color: '#FBBF24',
      timestamp: Date.now() - 1000 * 60 * 18,
      roomId: 'porch',
    },
    {
      id: 'seed-3',
      message: 'Bedroom temp set to 22°',
      subtitle: 'Automated schedule',
      color: '#A78BFA',
      timestamp: Date.now() - 1000 * 60 * 60 * 5,
      roomId: 'bedroom',
    },
  ],

  setMode: (mode) => {
    set({ mode });
    get().addLogEntry(
      mode === 'auto' ? 'Switched to Auto (PIR control)' : 'Switched to Manual (app control)',
      mode === 'auto' ? 'System' : 'User action',
      mode === 'auto' ? '#3B82F6' : '#F59E0B'
    );
  },

  setDefaultMode: (defaultMode) => set({ defaultMode }),

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
      `${room.name} turned ${newIsOn ? 'on' : 'off'}`,
      'Manual override',
      newIsOn ? '#22C55E' : 'rgba(255,255,255,0.4)',
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
    set({ temperature, humidity, lastUpdated: Date.now() }),

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

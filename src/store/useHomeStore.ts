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
  fanOn?: boolean;
  fanSpeed?: 'Off' | 'Low' | 'Medium' | 'High';
  targetTemp?: number;
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
  mode: Mode;
  defaultMode: Mode;

  rooms: Record<RoomId, RoomState>;

  temperature: number;
  humidity: number;
  lastUpdated: number;

  motionDetected: boolean;
  lastMotion: number | null;

  esp32Ip: string;
  isConnected: boolean;

  activityLog: ActivityEntry[];

  // Actions
  setMode: (mode: Mode) => void;
  setModeSilent: (mode: Mode) => void;
  setDefaultMode: (mode: Mode) => void;
  toggleRoom: (roomId: RoomId) => void;
  setRoomState: (roomId: RoomId, isOn: boolean) => void;
  setBedroomLight: (on: boolean) => void;
  setBedroomFan: (fanOn: boolean, fanSpeed?: 'Off' | 'Low' | 'Medium' | 'High') => void;
  setBedroomFanSilent: (fanOn: boolean) => void;
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
      targetTemp: 28.0, // matches firmware FAN_ON_TEMP
      mode: 'auto',
      temperature: 0,
      humidity: 0,
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

  temperature: 0,
  humidity: 0,
  lastUpdated: 0,
  motionDetected: false,
  lastMotion: null,
  esp32Ip: '',
  isConnected: false,
  activityLog: [],

  // With log entry (user action)
  setMode: (mode) => {
    set({ mode });
    get().addLogEntry(
      mode === 'auto' ? 'System switched to Auto' : 'System switched to Manual',
      mode === 'auto' ? 'PIR controls Living, DHT11 controls Fan' : 'Direct app override',
      mode === 'auto' ? '#3B82F6' : '#F59E0B'
    );
  },

  // Silent (poll sync, no log spam)
  setModeSilent: (mode) => set({ mode }),

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
    if (room.isOn === isOn) return; // no change, skip
    set({
      rooms: {
        ...state.rooms,
        [roomId]: { ...room, isOn },
      },
    });
  },

  setBedroomLight: (on) => {
    const state = get();
    const bedroom = state.rooms.bedroom;
    if (bedroom.isOn === on) return;
    set({
      rooms: {
        ...state.rooms,
        bedroom: { ...bedroom, isOn: on },
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
        bedroom: { ...bedroom, fanOn, fanSpeed: speed },
      },
    });
    get().addLogEntry(
      `Bedroom Fan ${fanOn ? 'turned ON' : 'turned OFF'}`,
      fanOn ? `Relay CH4 • Speed ${speed}` : 'Relay CH4 • Stopped',
      fanOn ? '#38BDF8' : 'rgba(255,255,255,0.4)',
      'bedroom'
    );
  },

  setBedroomFanSilent: (fanOn) => {
    const state = get();
    const bedroom = state.rooms.bedroom;
    if (bedroom.fanOn === fanOn) return;
    set({
      rooms: {
        ...state.rooms,
        bedroom: {
          ...bedroom,
          fanOn,
          fanSpeed: fanOn ? 'Low' : 'Off',
        },
      },
    });
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
    set((state) => ({
      temperature,
      humidity,
      lastUpdated: Date.now(),
      rooms: {
        ...state.rooms,
        bedroom: {
          ...state.rooms.bedroom,
          temperature,
          humidity,
        },
      },
    })),

  setMotionDetected: (motionDetected) =>
    set({
      motionDetected,
      lastMotion: motionDetected ? Date.now() : get().lastMotion,
    }),

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

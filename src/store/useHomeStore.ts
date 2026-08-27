import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  setRoomMode: (roomId: RoomId, mode: RoomMode) => void;
  setSensors: (temp: number, humidity: number) => void;
  setMotionDetected: (detected: boolean) => void;
  setEsp32Ip: (ip: string) => void;
  setConnected: (connected: boolean) => void;
  addLogEntry: (message: string, subtitle: string, color: string, roomId?: RoomId) => void;
  clearActivityLog: () => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      mode: 'manual',
      defaultMode: 'manual',

      rooms: {
        living: {
          id: 'living',
          name: 'Living Room',
          subtitle: 'Motion-activated lighting',
          icon: 'tv',
          isOn: true,
          mode: 'auto',
          relayChannel: 'CH2',
          ledCount: 3,
        },
        bedroom: {
          id: 'bedroom',
          name: 'Bedroom',
          subtitle: 'Lighting & ceiling fan',
          icon: 'moon',
          isOn: true,
          fanOn: true,
          fanSpeed: 'Low',
          mode: 'manual',
          temperature: 0,
          humidity: 0,
          relayChannel: 'CH3 / CH4',
          ledCount: 1,
        },
        porch: {
          id: 'porch',
          name: 'Porch',
          subtitle: 'Manual control',
          icon: 'sun',
          isOn: true,
          mode: 'manual',
          relayChannel: 'CH1',
          ledCount: 1,
        },
      },

      temperature: 24.5,
      humidity: 58.0,
      lastUpdated: Date.now(),
      motionDetected: false,
      lastMotion: null,
      esp32Ip: '',
      isConnected: false,
      activityLog: [],

      setMode: (mode) => {
        const prevMode = get().mode;
        if (prevMode === mode) return;
        set({ mode });
        get().addLogEntry(
          `System switched to ${mode === 'auto' ? 'Auto' : 'Manual'}`,
          mode === 'auto' ? 'Sensors handle lighting' : 'Direct app override',
          mode === 'auto' ? '#38BDF8' : '#F59E0B'
        );
      },

      setModeSilent: (mode) => {
        if (get().mode === mode) return;
        set({ mode });
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
          'Manual override',
          newIsOn ? '#F59E0B' : 'rgba(255,255,255,0.4)',
          roomId
        );
      },

      setRoomState: (roomId, isOn) => {
        const state = get();
        const room = state.rooms[roomId];
        if (room.isOn === isOn) return;
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
        set({
          rooms: {
            ...state.rooms,
            bedroom: { ...bedroom, fanOn, fanSpeed: fanOn ? 'Low' : 'Off' },
          },
        });
        get().addLogEntry(
          `Bedroom Fan ${fanOn ? 'turned ON' : 'turned OFF'}`,
          fanOn ? 'Active' : 'Fan stopped',
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
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          message,
          subtitle,
          color,
          timestamp: Date.now(),
          roomId,
        };
        set((state) => ({
          activityLog: [entry, ...state.activityLog].slice(0, 200),
        }));
      },

      clearActivityLog: () => set({ activityLog: [] }),
    }),
    {
      name: 'homely-smart-home-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activityLog: state.activityLog,
        esp32Ip: state.esp32Ip,
        defaultMode: state.defaultMode,
      }),
      merge: (persistedState: any, currentState: HomeState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          activityLog: Array.isArray(persistedState.activityLog) ? persistedState.activityLog : currentState.activityLog,
          esp32Ip: typeof persistedState.esp32Ip === 'string' ? persistedState.esp32Ip : currentState.esp32Ip,
          defaultMode: persistedState.defaultMode ?? currentState.defaultMode,
        };
      },
    }
  )
);

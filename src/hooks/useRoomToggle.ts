import { useCallback } from 'react';
import { useHomeStore, RoomId } from '../store/useHomeStore';
import { setRelay, setMode as apiSetMode, setTargetTemp as apiSetTargetTemp } from '../api/esp32';

export function useRoomToggle() {
  const store = useHomeStore();

  const toggleRoom = useCallback(async (roomId: RoomId) => {
    const room = useHomeStore.getState().rooms[roomId];
    const newIsOn = !room.isOn;

    store.toggleRoom(roomId);

    const relayMap: Record<RoomId, 'porch' | 'living' | 'bedroom_light'> = {
      porch: 'porch',
      living: 'living',
      bedroom: 'bedroom_light',
    };

    const ok = await setRelay(relayMap[roomId], newIsOn);

    if (!ok) {
      useHomeStore.getState().setRoomState(roomId, !newIsOn);
      useHomeStore.getState().addLogEntry(
        `Failed to ${newIsOn ? 'turn on' : 'turn off'} ${room.name}`,
        'ESP32 not responding',
        '#F87171',
        roomId
      );
    }
  }, []);

  const toggleBedroomFan = useCallback(async (on: boolean) => {
    store.setBedroomFan(on, on ? 'Low' : 'Off');

    const ok = await setRelay('bedroom_fan', on);

    if (!ok) {
      useHomeStore.getState().setBedroomFan(!on, !on ? 'Low' : 'Off');
      useHomeStore.getState().addLogEntry(
        `Failed to ${on ? 'turn on' : 'turn off'} Bedroom Fan`,
        'ESP32 not responding',
        '#F87171',
        'bedroom'
      );
    }
  }, []);

  const switchMode = useCallback(async (mode: 'auto' | 'manual') => {
    store.setMode(mode);

    const ok = await apiSetMode(mode);

    if (!ok) {
      const prev = useHomeStore.getState().mode === 'auto' ? 'manual' : 'auto';
      useHomeStore.getState().setMode(prev);
      useHomeStore.getState().addLogEntry(
        'Failed to switch mode',
        'ESP32 not responding',
        '#F87171'
      );
    }
  }, []);

  const updateTargetTemp = useCallback(async (temp: number) => {
    store.setTargetTemp(temp);
    await apiSetTargetTemp(temp);
  }, []);

  return { toggleRoom, toggleBedroomFan, switchMode, updateTargetTemp };
}

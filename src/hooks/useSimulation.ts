import { useEffect, useRef } from 'react';
import { useHomeStore } from '../store/useHomeStore';

/**
 * Simulates ESP32 behavior for testing without real hardware.
 * In auto mode: triggers motion events that turn on porch + living room.
 * Also simulates sensor fluctuations.
 */
export function useSimulation() {
  const store = useHomeStore();
  const motionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Simulate sensor fluctuation every 4 seconds
    const sensorInterval = setInterval(() => {
      const temp = 23.5 + Math.random() * 2;
      const humidity = 58 + Math.random() * 10;
      store.setSensors(
        Math.round(temp * 10) / 10,
        Math.round(humidity)
      );
    }, 4000);

    return () => clearInterval(sensorInterval);
  }, []);

  useEffect(() => {
    if (store.mode !== 'auto') return;

    // Simulate PIR motion every 12 seconds in auto mode
    const motionInterval = setInterval(() => {
      const state = useHomeStore.getState();
      if (state.mode !== 'auto') return;

      // Motion detected
      state.setMotionDetected(true);
      state.setRoomState('porch', true);
      state.setRoomState('living', true);
      state.addLogEntry('PIR: Motion detected → Porch + Living ON', '#22C55E');

      // Clear previous timeout
      if (motionTimeoutRef.current) {
        clearTimeout(motionTimeoutRef.current);
      }

      // Turn off after 5 seconds (simulating no motion timeout)
      motionTimeoutRef.current = setTimeout(() => {
        const s = useHomeStore.getState();
        s.setMotionDetected(false);
        s.setRoomState('porch', false);
        s.setRoomState('living', false);
        s.addLogEntry('PIR: No motion for 5s → Porch + Living OFF', 'rgba(255,255,255,0.4)');
      }, 5000);
    }, 12000);

    // Trigger first motion after 3 seconds
    const initialTimeout = setTimeout(() => {
      const state = useHomeStore.getState();
      if (state.mode !== 'auto') return;

      state.setMotionDetected(true);
      state.setRoomState('porch', true);
      state.setRoomState('living', true);
      state.addLogEntry('PIR: Motion detected → Porch + Living ON', '#22C55E');

      motionTimeoutRef.current = setTimeout(() => {
        const s = useHomeStore.getState();
        s.setMotionDetected(false);
        s.setRoomState('porch', false);
        s.setRoomState('living', false);
        s.addLogEntry('PIR: No motion for 5s → Porch + Living OFF', 'rgba(255,255,255,0.4)');
      }, 5000);
    }, 3000);

    return () => {
      clearInterval(motionInterval);
      clearTimeout(initialTimeout);
      if (motionTimeoutRef.current) clearTimeout(motionTimeoutRef.current);
    };
  }, [store.mode]);
}

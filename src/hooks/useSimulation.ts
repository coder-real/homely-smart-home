import { useEffect, useRef } from 'react';
import { useHomeStore } from '../store/useHomeStore';

/**
 * Simulates ESP32 star-topology sensor & relay logic:
 * 1. PIR Motion (Living Room entrance):
 *    In auto mode -> triggers Living Room lights (Relay CH2, 3 LEDs).
 * 2. DHT11 (Bedroom wall offset from fan):
 *    Ambient temp & humidity fluctuations -> triggers Bedroom Fan (Relay CH4) when temp >= targetTemp.
 * 3. Porch Light (Relay CH1) & Bedroom Light (Relay CH3):
 *    Manual app-controlled only (no false-trigger outdoor PIR).
 */
export function useSimulation() {
  const store = useHomeStore();
  const motionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Simulate DHT11 bedroom climate readings every 4 seconds
    const sensorInterval = setInterval(() => {
      const state = useHomeStore.getState();
      const currentTemp = state.temperature;
      // Slight smooth drift
      const delta = (Math.random() - 0.48) * 0.6;
      const nextTemp = Math.max(21.5, Math.min(27.0, Math.round((currentTemp + delta) * 10) / 10));
      const nextHumidity = Math.max(45, Math.min(80, Math.round(58 + (Math.random() - 0.5) * 8)));

      state.setSensors(nextTemp, nextHumidity);

      // Check bedroom fan threshold logic if in auto mode
      const bedroom = state.rooms.bedroom;
      const isAuto = state.mode === 'auto' || bedroom.mode === 'auto';
      const target = bedroom.targetTemp ?? 24.0;

      if (isAuto) {
        if (nextTemp >= target && !bedroom.fanOn) {
          state.setBedroomFan(true, 'Low');
          state.addLogEntry(
            'DHT11: Temp exceeded threshold → Bedroom Fan ON',
            `Reading ${nextTemp}°C >= ${target}°C (CH4)`,
            '#38BDF8',
            'bedroom'
          );
        } else if (nextTemp < target && bedroom.fanOn) {
          state.setBedroomFan(false, 'Off');
          state.addLogEntry(
            'DHT11: Temp normalized → Bedroom Fan OFF',
            `Reading ${nextTemp}°C < ${target}°C (CH4)`,
            'rgba(255,255,255,0.4)',
            'bedroom'
          );
        }
      }
    }, 4000);

    return () => clearInterval(sensorInterval);
  }, []);

  useEffect(() => {
    if (store.mode !== 'auto') return;

    // Simulate PIR motion at Living Room entrance every 14 seconds in auto mode
    const motionInterval = setInterval(() => {
      const state = useHomeStore.getState();
      if (state.mode !== 'auto' && state.rooms.living.mode !== 'auto') return;

      // Motion detected -> Living Room lights ON (CH2, 3 LEDs)
      state.setMotionDetected(true);
      state.setRoomState('living', true);
      state.addLogEntry(
        'PIR: Motion at entrance → Living Room lights ON',
        'Relay CH2 • 3 LEDs Ceiling Wash',
        '#10B981',
        'living'
      );

      // Clear previous timeout
      if (motionTimeoutRef.current) {
        clearTimeout(motionTimeoutRef.current);
      }

      // Turn off after 5 seconds (simulating no motion timeout)
      motionTimeoutRef.current = setTimeout(() => {
        const s = useHomeStore.getState();
        s.setMotionDetected(false);
        if (s.mode === 'auto' || s.rooms.living.mode === 'auto') {
          s.setRoomState('living', false);
          s.addLogEntry(
            'PIR: No motion for 5s → Living Room lights OFF',
            'Relay CH2 • Standby',
            'rgba(255,255,255,0.4)',
            'living'
          );
        }
      }, 5000);
    }, 14000);

    // Initial motion trigger
    const initialTimeout = setTimeout(() => {
      const state = useHomeStore.getState();
      if (state.mode !== 'auto') return;

      state.setMotionDetected(true);
      state.setRoomState('living', true);
      state.addLogEntry(
        'PIR: Motion at entrance → Living Room lights ON',
        'Relay CH2 • 3 LEDs Ceiling Wash',
        '#10B981',
        'living'
      );

      motionTimeoutRef.current = setTimeout(() => {
        const s = useHomeStore.getState();
        s.setMotionDetected(false);
        if (s.mode === 'auto' || s.rooms.living.mode === 'auto') {
          s.setRoomState('living', false);
          s.addLogEntry(
            'PIR: No motion for 5s → Living Room lights OFF',
            'Relay CH2 • Standby',
            'rgba(255,255,255,0.4)',
            'living'
          );
        }
      }, 5000);
    }, 2500);

    return () => {
      clearInterval(motionInterval);
      clearTimeout(initialTimeout);
      if (motionTimeoutRef.current) clearTimeout(motionTimeoutRef.current);
    };
  }, [store.mode]);
}

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { startPolling, stopPolling, discoverDevice, reconnect } from '../api/esp32';
import { useHomeStore } from '../store/useHomeStore';

/**
 * Manages ESP32 connection lifecycle.
 * - Runs discovery on mount, then starts polling regardless of result
 *   (polling's own ping() drives the connected/disconnected state and the
 *   retry loop handles reconnection automatically).
 * - On foreground resume: re-runs discovery to resolve the correct URL,
 *   then restarts polling.
 * - Stops polling when the app goes to background.
 */
export function usePolling() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const connect = async () => {
      // Try to pin down the URL (mDNS or manual IP), but don't block on it —
      // polling will start either way and the retry loop will reconnect if
      // discovery fails on first attempt.
      await discoverDevice();
      startPolling();
    };

    connect();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/background|inactive/) && nextState === 'active') {
        // Back to foreground — re-discover then resume polling
        connect();
      } else if (nextState === 'background') {
        // Going to background — stop polling to save battery
        stopPolling();
      }
      appState.current = nextState;
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, []);
}

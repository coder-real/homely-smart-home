import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { startPolling, stopPolling, discoverDevice } from '../api/esp32';
import { useHomeStore } from '../store/useHomeStore';

/**
 * Manages ESP32 connection lifecycle.
 * - Discovers device via mDNS on mount
 * - Starts polling when app is in foreground
 * - Stops polling when app goes to background
 * - Cleans up on unmount
 */
export function usePolling() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const connect = async () => {
      const found = await discoverDevice();
      if (found) {
        startPolling();
      } else {
        useHomeStore.getState().setConnected(false);
      }
    };

    connect();

    // Listen for app foreground/background
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/background/) && nextState === 'active') {
        // Came back to foreground — reconnect
        connect();
      } else if (nextState === 'background') {
        // Went to background — stop polling to save battery
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

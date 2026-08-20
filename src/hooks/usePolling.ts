import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { startPolling, stopPolling, discoverDevice } from '../api/esp32';

export function usePolling() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const connect = async () => {
      await discoverDevice();
      startPolling();
    };

    connect();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/background|inactive/) && nextState === 'active') {
        connect();
      } else if (nextState === 'background') {
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

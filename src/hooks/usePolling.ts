import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { startPolling, stopPolling, discoverDevice } from '../api/esp32';
import {
  startDiscoveryListener,
  stopDiscoveryListener,
} from '../api/udpDiscovery';
import { useHomeStore } from '../store/useHomeStore';

export function usePolling() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const connect = async () => {
      await discoverDevice();
      startPolling();
      startDiscoveryListener((ip) => {
        useHomeStore.getState().setEsp32Ip(ip);
      });
    };

    connect();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/background|inactive/) && nextState === 'active') {
        connect();
      } else if (nextState === 'background') {
        stopPolling();
        stopDiscoveryListener();
      }
      appState.current = nextState;
    });

    return () => {
      stopPolling();
      stopDiscoveryListener();
      subscription.remove();
    };
  }, []);
}

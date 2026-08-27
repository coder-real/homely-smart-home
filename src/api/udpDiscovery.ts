import { createSocket, type UdpSocket, type MessageEvent } from '@isvend/expo-udp';
import { useHomeStore } from '../store/useHomeStore';

const DISCOVERY_PORT = 4210;
const DEVICE_ID = 'homely-smarthome';

let socket: UdpSocket | null = null;
let isListening = false;
let onDeviceFoundCallback: ((ip: string) => void) | null = null;

function decodePayload(data: Uint8Array): string {
  try {
    const bytes = new Uint8Array(data);
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return str;
  } catch {
    return '';
  }
}

function handleMessage(event: MessageEvent) {
  const raw = decodePayload(event.data);
  try {
    const json = JSON.parse(raw);
    if (json.device === DEVICE_ID && json.ip) {
      console.log(`[UDP] Discovered ${json.device} at ${json.ip}`);
      const store = useHomeStore.getState();
      if (!store.esp32Ip) {
        store.setEsp32Ip(json.ip);
      }
      onDeviceFoundCallback?.(json.ip);
    }
  } catch {
    // Not a valid JSON packet, ignore
  }
}

export async function startDiscoveryListener(
  onDeviceFound: (ip: string) => void
): Promise<void> {
  if (isListening) {
    onDeviceFoundCallback = onDeviceFound;
    return;
  }

  try {
    socket = await createSocket({ type: 'udp4', reuseAddress: true });
    await socket.bind({ port: DISCOVERY_PORT, address: '0.0.0.0' });
    socket.addListener('message', handleMessage);
    isListening = true;
    onDeviceFoundCallback = onDeviceFound;
    console.log(`[UDP] Listening for discovery broadcasts on port ${DISCOVERY_PORT}`);
  } catch (err) {
    console.warn('[UDP] Failed to start discovery listener:', err);
    isListening = false;
  }
}

export async function stopDiscoveryListener(): Promise<void> {
  if (socket) {
    try {
      await socket.close();
    } catch {
      // Already closed
    }
    socket = null;
  }
  isListening = false;
  onDeviceFoundCallback = null;
}

export async function discoverByUdp(timeoutMs = 5000): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        stopDiscoveryListener();
        resolve(null);
      }
    }, timeoutMs);

    startDiscoveryListener((ip) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        stopDiscoveryListener();
        resolve(ip);
      }
    });
  });
}

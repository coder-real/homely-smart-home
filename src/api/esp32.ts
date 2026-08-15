import { useHomeStore } from '../store/useHomeStore';

const POLL_INTERVAL = 4000; // 4 seconds
let pollTimer: ReturnType<typeof setInterval> | null = null;

function getBaseUrl(): string | null {
  const ip = useHomeStore.getState().esp32Ip;
  if (!ip) return null;
  return `http://${ip}`;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const base = getBaseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { 'X-Api-Key': 'smart-home-2024' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function postJson(path: string, body: Record<string, unknown>): Promise<boolean> {
  const base = getBaseUrl();
  if (!base) return false;
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'smart-home-2024',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Public API ──

export interface SensorData {
  temperature: number;
  humidity: number;
}

export interface StatusData {
  motion: boolean;
  motor: boolean;
  led: boolean;
  mode: 'auto' | 'manual';
}

export async function fetchSensors(): Promise<SensorData | null> {
  return fetchJson<SensorData>('/sensors');
}

export async function fetchStatus(): Promise<StatusData | null> {
  return fetchJson<StatusData>('/status');
}

export async function setRelayState(
  channel: 'motor' | 'porch' | 'living',
  state: 'on' | 'off'
): Promise<boolean> {
  return postJson(`/relay/${channel}`, { state });
}

export async function setMode(mode: 'auto' | 'manual'): Promise<boolean> {
  return postJson('/mode', { mode });
}

// ── Polling ──

export function startPolling() {
  stopPolling();

  const poll = async () => {
    const store = useHomeStore.getState();

    const [sensors, status] = await Promise.all([
      fetchSensors(),
      fetchStatus(),
    ]);

    if (sensors) {
      store.setSensors(sensors.temperature, sensors.humidity);
      store.setConnected(true);
    }

    if (status) {
      store.setMotionDetected(status.motion);
      store.setConnected(true);

      // Sync room states from ESP32
      if (status.mode === 'auto') {
        store.setRoomState('porch', status.motor);
        store.setRoomState('living', status.led);
      }
    }

    // If both failed, mark disconnected
    if (!sensors && !status && store.esp32Ip) {
      store.setConnected(false);
    }
  };

  poll();
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

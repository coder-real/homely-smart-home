import { useHomeStore } from '../store/useHomeStore';

// ── Config ──
const MDNS_HOST = 'homely-smarthome.local';
const POLL_INTERVAL = 3000;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let baseUrl: string | null = null;

// ── Network helpers ──

function getBaseUrl(): string {
  if (baseUrl) return baseUrl;
  const store = useHomeStore.getState();
  // Try mDNS first, fall back to manual IP
  return store.esp32Ip
    ? `http://${store.esp32Ip}`
    : `http://${MDNS_HOST}`;
}

async function fetchJson<T>(path: string, timeoutMs = 3000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${getBaseUrl()}${path}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function postJson(
  path: string,
  body: Record<string, unknown>,
  timeoutMs = 3000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// ── Response types (match firmware exactly) ──

export interface StatusResponse {
  mode: 'auto' | 'manual';
  porch: { on: boolean };
  living: { on: boolean; motion: boolean };
  bedroom_light: { on: boolean };
  bedroom_fan: { on: boolean };
}

export interface SensorResponse {
  temperature: number;
  humidity: number;
}

// ── API calls ──

export async function ping(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${getBaseUrl()}/ping`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchStatus(): Promise<StatusResponse | null> {
  return fetchJson<StatusResponse>('/status');
}

export async function fetchSensors(): Promise<SensorResponse | null> {
  return fetchJson<SensorResponse>('/sensors');
}

export async function setRelay(
  channel: 'porch' | 'living' | 'bedroom_light' | 'bedroom_fan',
  on: boolean
): Promise<boolean> {
  return postJson(`/relay/${channel}`, { on });
}

export async function setMode(mode: 'auto' | 'manual'): Promise<boolean> {
  return postJson('/mode', { mode });
}

// ── Polling ──

export async function startPolling() {
  stopPolling();

  const poll = async () => {
    const store = useHomeStore.getState();
    const connected = await ping();

    if (!connected) {
      store.setConnected(false);
      return;
    }

    store.setConnected(true);

    const [status, sensors] = await Promise.all([
      fetchStatus(),
      fetchSensors(),
    ]);

    if (status) {
      // Sync mode
      if (store.mode !== status.mode) {
        // Don't trigger log entries on poll sync — only on user action
        store.setModeSilent(status.mode);
      }

      // Sync room states
      store.setRoomState('porch', status.porch.on);
      store.setRoomState('living', status.living.on);
      store.setMotionDetected(status.living.motion);
      store.setBedroomLight(status.bedroom_light.on);
      store.setBedroomFan(status.bedroom_fan.on);
    }

    if (sensors && sensors.temperature > 0) {
      store.setSensors(sensors.temperature, sensors.humidity);
    }
  };

  // First poll immediately
  await poll();

  // Then every 3 seconds
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ── mDNS discovery ──

export async function discoverDevice(): Promise<boolean> {
  // Try mDNS hostname first
  baseUrl = `http://${MDNS_HOST}`;
  const mdnsOk = await ping();
  if (mdnsOk) return true;

  // Try manual IP if set
  const ip = useHomeStore.getState().esp32Ip;
  if (ip) {
    baseUrl = `http://${ip}`;
    const ipOk = await ping();
    if (ipOk) return true;
  }

  baseUrl = null;
  return false;
}

export function setManualIp(ip: string) {
  if (ip) {
    baseUrl = `http://${ip}`;
  } else {
    baseUrl = null; // fall back to mDNS
  }
}

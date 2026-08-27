import { useHomeStore } from '../store/useHomeStore';

const MDNS_HOST = 'homely-smarthome.local';
const POLL_INTERVAL = 1500;
const REQUEST_TIMEOUT = 2000;
const COMMAND_LOCK_MS = 2500;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let activeBaseUrl: string | null = null;
let isPollInProgress = false;
let lastCommandTime = 0;

function getTargetUrl(): string {
  if (activeBaseUrl) return activeBaseUrl;
  const store = useHomeStore.getState();
  return store.esp32Ip
    ? `http://${store.esp32Ip}`
    : `http://${MDNS_HOST}`;
}

async function fetchWithTimeout<T>(url: string, timeoutMs = REQUEST_TIMEOUT): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface FullStatusResponse {
  mode: 'auto' | 'manual';
  porch: { on: boolean };
  living: { on: boolean; motion: boolean };
  bedroom_light: { on: boolean };
  bedroom_fan: { on: boolean };
  temperature?: number;
  humidity?: number;
}

export async function pingUrl(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${baseUrl}/ping`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function ping(): Promise<boolean> {
  return pingUrl(getTargetUrl());
}

export async function fetchFullStatus(): Promise<FullStatusResponse | null> {
  return fetchWithTimeout<FullStatusResponse>(`${getTargetUrl()}/status`);
}

export async function setRelay(
  channel: 'porch' | 'living' | 'bedroom_light' | 'bedroom_fan',
  on: boolean
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const res = await fetch(`${getTargetUrl()}/relay/${channel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) lastCommandTime = Date.now();
    return res.ok;
  } catch {
    return false;
  }
}

export async function setMode(mode: 'auto' | 'manual'): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const res = await fetch(`${getTargetUrl()}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) lastCommandTime = Date.now();
    return res.ok;
  } catch {
    return false;
  }
}

export async function resetEsp32Wifi(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const res = await fetch(`${getTargetUrl()}/reset-wifi`, {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function discoverDevice(): Promise<boolean> {
  const manualIp = useHomeStore.getState().esp32Ip.trim();

  if (manualIp) {
    const ipUrl = `http://${manualIp}`;
    if (await pingUrl(ipUrl)) {
      activeBaseUrl = ipUrl;
      return true;
    }
  }

  const mdnsUrl = `http://${MDNS_HOST}`;
  if (await pingUrl(mdnsUrl)) {
    activeBaseUrl = mdnsUrl;
    return true;
  }

  if (manualIp) {
    activeBaseUrl = `http://${manualIp}`;
  } else {
    activeBaseUrl = mdnsUrl;
  }

  return false;
}

export function setManualIp(ip: string) {
  const trimmed = ip.trim();
  activeBaseUrl = trimmed ? `http://${trimmed}` : `http://${MDNS_HOST}`;
}

export async function startPolling() {
  stopPolling();

  const poll = async () => {
    if (isPollInProgress) return;
    isPollInProgress = true;

    try {
      const store = useHomeStore.getState();
      const data = await fetchFullStatus();

      if (!data) {
        store.setConnected(false);
        discoverDevice();
        return;
      }

      if (!store.isConnected) {
        store.setConnected(true);
      }

      store.setMotionDetected(data.living.motion);
      if (data.temperature !== undefined && data.humidity !== undefined) {
        store.setSensors(data.temperature, data.humidity);
      }

      // Skip sync if user just sent a command (prevents flicker)
      const isLocked = (Date.now() - lastCommandTime) < COMMAND_LOCK_MS;
      if (isLocked) return;

      if (store.mode !== data.mode) {
        store.setModeSilent(data.mode);
      }
      store.setRoomState('porch', data.porch.on);
      store.setRoomState('living', data.living.on);
      store.setBedroomLight(data.bedroom_light.on);
      store.setBedroomFanSilent(data.bedroom_fan.on);
    } finally {
      isPollInProgress = false;
    }
  };

  await poll();
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  isPollInProgress = false;
}

export async function reconnect(): Promise<boolean> {
  stopPolling();
  const found = await discoverDevice();
  startPolling();
  return found;
}

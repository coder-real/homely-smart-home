import { useHomeStore } from '../store/useHomeStore';
import {
  discoverByUdp,
  startDiscoveryListener,
  stopDiscoveryListener,
} from './udpDiscovery';

const MDNS_HOST = 'homely-smarthome.local';
const POLL_INTERVAL = 1500;
const REQUEST_TIMEOUT = 3000;
const COMMAND_LOCK_MS = 2000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let activeBaseUrl: string | null = null;
let isPollInProgress = false;
let lastCommandTime = 0;
let lastCommandKey: string | null = null;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(
  path: string,
  body: object,
  retries = MAX_RETRIES
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      const res = await fetch(`${getTargetUrl()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        lastCommandTime = Date.now();
        return true;
      }
    } catch {
      // failed — retry
    }
    if (attempt < retries) await sleep(RETRY_DELAY_MS * (attempt + 1));
  }
  return false;
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
  const key = `relay:${channel}:${on}`;
  if (key === lastCommandKey) return false;
  lastCommandKey = key;
  return postWithRetry(`/relay/${channel}`, { on });
}

export async function setMode(mode: 'auto' | 'manual'): Promise<boolean> {
  const key = `mode:${mode}`;
  if (key === lastCommandKey) return false;
  lastCommandKey = key;
  return postWithRetry('/mode', { mode });
}

export async function resetEsp32Wifi(): Promise<boolean> {
  return postWithRetry('/reset-wifi', {});
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

  const udpIp = await discoverByUdp(4000);
  if (udpIp) {
    const udpUrl = `http://${udpIp}`;
    if (await pingUrl(udpUrl)) {
      activeBaseUrl = udpUrl;
      useHomeStore.getState().setEsp32Ip(udpIp);
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
  stopDiscoveryListener();
  const found = await discoverDevice();
  startPolling();
  startDiscoveryListener((ip) => {
    const url = `http://${ip}`;
    activeBaseUrl = url;
    useHomeStore.getState().setEsp32Ip(ip);
  });
  return found;
}

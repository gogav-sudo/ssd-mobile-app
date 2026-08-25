import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_IDENTITY_KEY = 'device_identity_id';

// AsyncStorage on Android runs on a single serial SQLite executor. A
// corrupted database file, a stale lock left by a killed process, or a
// starved native thread pool can leave one operation stuck forever — and
// because the executor is serial, every call queued behind it hangs too.
// This is a local, non-network op, so AbortController doesn't apply; the
// only reliable guard is the same independent-timer race used elsewhere
// in this app (see withFallbackTimeout.ts) — whichever settles first wins,
// and a stuck native call is simply abandoned instead of blocking the
// caller (and, transitively, the network request that would follow it).
const STORAGE_TIMEOUT_MS = 3000;

function raceWithLocalTimeout<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;

    const forceTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn(`[deviceIdentity] "${label}" timed out after ${STORAGE_TIMEOUT_MS}ms — using fallback.`);
      resolve(fallback);
    }, STORAGE_TIMEOUT_MS);

    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(forceTimer);
        resolve(value);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(forceTimer);
        console.warn(`[deviceIdentity] "${label}" rejected:`, err?.message ?? err);
        resolve(fallback);
      }
    );
  });
}

// RFC4122-ish v4 UUID generator (no native crypto dependency needed).
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceIdentityId(): Promise<string | null> {
  return raceWithLocalTimeout(
    AsyncStorage.getItem(DEVICE_IDENTITY_KEY),
    null,
    'getItem(device_identity_id)'
  );
}

export async function createDeviceIdentityId(): Promise<string> {
  const existing = await raceWithLocalTimeout(
    AsyncStorage.getItem(DEVICE_IDENTITY_KEY),
    null,
    'getItem(device_identity_id)'
  );
  if (existing) return existing;

  const id = generateUuid();
  // Best-effort persist: if the write hangs, still hand back the freshly
  // generated id so the caller isn't blocked. Worst case it wasn't saved
  // and a new id gets generated next launch.
  await raceWithLocalTimeout(
    AsyncStorage.setItem(DEVICE_IDENTITY_KEY, id),
    undefined,
    'setItem(device_identity_id)'
  );
  return id;
}

export async function clearDeviceIdentityId(): Promise<void> {
  await raceWithLocalTimeout(
    AsyncStorage.removeItem(DEVICE_IDENTITY_KEY),
    undefined,
    'removeItem(device_identity_id)'
  );
}

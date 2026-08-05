import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_IDENTITY_KEY = 'device_identity_id';

// RFC4122-ish v4 UUID generator (no native crypto dependency needed).
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceIdentityId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_IDENTITY_KEY);
}

export async function createDeviceIdentityId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_IDENTITY_KEY);
  if (existing) return existing;
  const id = generateUuid();
  await AsyncStorage.setItem(DEVICE_IDENTITY_KEY, id);
  return id;
}

export async function clearDeviceIdentityId(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_IDENTITY_KEY);
}

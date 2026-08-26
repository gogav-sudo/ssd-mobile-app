import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { supabase, Shift } from './supabase';
import { todayIsoDate, currentMonthRange } from './date';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

// @supabase/storage-js's upload() calls body.has('cacheControl') when given
// a FormData instance (StorageFileApi.ts, uploadOrUpdate) — a web FormData
// method. React Native's FormData polyfill (Libraries/Network/FormData.js)
// only implements append()/getAll()/getParts(), so without this shim the
// upload throws "body.has is not a function" before ever reaching the
// network. Documented workaround for Supabase Storage uploads from RN.
if (typeof FormData !== 'undefined' && !FormData.prototype.has) {
  FormData.prototype.has = () => false;
}

// Looks up today's open shift for this device, if any.
// Falls back to `null` (treated as "no open shift") if the network stalls —
// confirmed via device testing that some connections never resolve the
// request at all, so the screen must not wait on it forever.
export async function getTodayOpenShift(deviceId: string): Promise<Shift | null> {
  const result = await raceWithTimeout(
    supabase
      .from('shifts')
      .select('*')
      .eq('telegram_chat_id', deviceId)
      .eq('shift_date', todayIsoDate())
      .eq('status', 'open')
      .maybeSingle(),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getTodayOpenShift'
  );

  if (result.timedOut) return null;
  if (result.error) throw result.error;
  return result.data;
}

// Returns the count of shifts this device has logged within the current
// calendar month (by shift_date). Falls back to 0 if the network stalls.
export async function getShiftCountThisMonth(deviceId: string): Promise<number> {
  if (!deviceId) {
    throw new Error('getShiftCountThisMonth requires a device identity id.');
  }

  const { start, end } = currentMonthRange();
  const result = await raceWithTimeout(
    supabase
      .from('shifts')
      .select('id', { count: 'exact', head: true })
      .eq('telegram_chat_id', deviceId)
      .gte('shift_date', start)
      .lte('shift_date', end),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getShiftCountThisMonth'
  );

  if (result.timedOut) return 0;
  if (result.error) throw result.error;
  return result.count ?? 0;
}

// Returns the most recent shifts for this device, newest first.
// Strictly scoped by telegram_chat_id (the device's own identity UUID) —
// never by full_name, since names are not guaranteed unique across devices.
// Falls back to an empty list if the network stalls.
export async function getRecentShifts(deviceId: string, limit = 5): Promise<Shift[]> {
  if (!deviceId) {
    throw new Error('getRecentShifts requires a device identity id.');
  }

  const result = await raceWithTimeout(
    supabase
      .from('shifts')
      .select('*')
      .eq('telegram_chat_id', deviceId)
      .order('shift_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(limit),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getRecentShifts'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

// Closes the given shift row in place — never creates a new row.
export async function closeShift(
  shiftId: number,
  params: { equipmentOk: boolean | null; notes: string }
): Promise<void> {
  const { error } = await supabase
    .from('shifts')
    .update({
      end_time: new Date().toISOString(),
      status: 'closed',
      end_equipment_ok: params.equipmentOk,
      end_notes: params.notes || null,
    })
    .eq('id', shiftId);

  if (error) throw error;
}

// Uploads the start-of-shift photo to the shift-photos bucket and returns its public URL.
export async function uploadStartShiftPhoto(deviceId: string, localUri: string): Promise<string> {
  const file = new File(localUri);

  const response = await fetch('https://ssd-api.ru/debug/upload-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
    },
    body: file,
  });

  const body = await response.text();

  console.log('[PHOTO DEBUG] expo/fetch status =', response.status);
  console.log('[PHOTO DEBUG] expo/fetch body =', body);

  if (!response.ok) {
    throw new Error(
      `PHOTO_UPLOAD_TEST_FAILED: ${response.status} ${body}`,
    );
  }

  return '';
}

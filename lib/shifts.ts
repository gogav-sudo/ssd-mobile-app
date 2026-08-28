import { supabase, supabaseDirect, Shift } from './supabase';
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

// A "did we actually verify this?" result — collapsing a network timeout or
// error into the same value as a confirmed-empty result (e.g. `null`) makes
// it impossible for a caller to tell "no shift" apart from "couldn't check,"
// which previously caused the home screen to report "not open" even when a
// shift genuinely existed server-side. `unknown` must never be presented to
// the user as a confirmed absence/closure.
export type ShiftLookupResult =
  | { status: 'open'; shift: Shift }
  | { status: 'none' }
  | { status: 'unknown' };

export type ShiftByIdResult =
  | { status: 'found'; shift: Shift }
  | { status: 'not_found' }
  | { status: 'unknown' };

// Safe, structured diagnostics for upload/create-shift failures. Deliberately
// limited to fields that can never contain secrets or reveal a working
// object URL with a token: operation name, HTTP-ish status/code, bucket,
// the bare object path (device id + date, no query string), MIME type,
// byte size, and the error's own message. Never pass a full URL, headers,
// `.env` values, or the photo bytes into this.
type OperationDiagnostics = {
  operation: string;
  status?: number | string;
  bucket?: string;
  objectPath?: string;
  mimeType?: string;
  fileSize?: number;
  message: string;
};

function logOperationFailure(diag: OperationDiagnostics): void {
  console.warn('[ShiftPersistence] operation failed:', diag);
}

// Structured, outcome-inclusive logging for the direct (supabaseDirect)
// critical path — unlike logOperationFailure (failures only), this also
// logs successes, so elapsed time is visible even when things go right.
// Never pass a URL, header, `.env` value, or photo bytes into this — only
// operation name, elapsed time, outcome, shiftId, and a short message.
export type ShiftWriteOutcome = 'success' | 'timeout' | 'network-error' | 'supabase-error';

export type ShiftWriteDiagnostics = {
  operation: string;
  elapsedMs: number;
  outcome: ShiftWriteOutcome;
  shiftId?: number | null;
  message?: string;
};

export function logShiftWriteOutcome(diag: ShiftWriteDiagnostics): void {
  console.log('[ShiftPersistence]', diag);
}

// Looks up today's open shift for this device, if any. Distinguishes a
// confirmed-empty result ('none') from a network timeout or error
// ('unknown') — confirmed via device testing that some connections never
// resolve the request at all, so the screen must not wait on it forever,
// but it also must not claim "no shift" when it simply couldn't check.
export async function getTodayOpenShift(
  deviceId: string,
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS
): Promise<ShiftLookupResult> {
  const result = await raceWithTimeout(
    supabase
      .from('shifts')
      .select('*')
      .eq('telegram_chat_id', deviceId)
      .eq('shift_date', todayIsoDate())
      .eq('status', 'open')
      .maybeSingle(),
    timeoutMs,
    'getTodayOpenShift'
  );

  if (result.timedOut) return { status: 'unknown' };
  if (result.error) return { status: 'unknown' };
  return result.data ? { status: 'open', shift: result.data } : { status: 'none' };
}

// Confirmation read for a specific shift row by id — used after an
// insert/update to verify the write actually landed, instead of trusting
// the write's own response alone.
export async function getShiftById(shiftId: number): Promise<ShiftByIdResult> {
  const result = await raceWithTimeout(
    supabase.from('shifts').select('*').eq('id', shiftId).maybeSingle(),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getShiftById'
  );

  if (result.timedOut) return { status: 'unknown' };
  if (result.error) return { status: 'unknown' };
  return result.data ? { status: 'found', shift: result.data } : { status: 'not_found' };
}

// Direct-client (supabaseDirect) equivalent of getTodayOpenShift, used ONLY
// inside the critical open/close-shift path (ensureOpenShift below). Bypasses
// the ssd-api.ru proxy — see the note above ensureOpenShift for why — and
// deliberately does NOT wrap the call in raceWithTimeout/DEFAULT_QUERY_TIMEOUT_MS:
// the calling screen's own longer force-timer is the only budget that applies
// here. Never used outside this critical flow.
export async function getTodayOpenShiftDirect(deviceId: string): Promise<ShiftLookupResult> {
  const startedAt = Date.now();
  let response: { data: Shift | null; error: { message: string } | null };
  try {
    response = await supabaseDirect
      .from('shifts')
      .select('*')
      .eq('telegram_chat_id', deviceId)
      .eq('shift_date', todayIsoDate())
      .eq('status', 'open')
      .maybeSingle();
  } catch (err: any) {
    logShiftWriteOutcome({
      operation: 'direct-lookup-open-shift',
      elapsedMs: Date.now() - startedAt,
      outcome: 'network-error',
      message: err?.message ?? String(err),
    });
    return { status: 'unknown' };
  }

  if (response.error) {
    logShiftWriteOutcome({
      operation: 'direct-lookup-open-shift',
      elapsedMs: Date.now() - startedAt,
      outcome: 'supabase-error',
      message: response.error.message,
    });
    return { status: 'unknown' };
  }

  logShiftWriteOutcome({
    operation: 'direct-lookup-open-shift',
    elapsedMs: Date.now() - startedAt,
    outcome: 'success',
  });
  return response.data ? { status: 'open', shift: response.data } : { status: 'none' };
}

// Direct-client (supabaseDirect) equivalent of getShiftById, used ONLY inside
// the critical open/close-shift path and its notes-confirmation steps. Same
// no-raceWithTimeout rationale as getTodayOpenShiftDirect above.
export async function getShiftByIdDirect(shiftId: number): Promise<ShiftByIdResult> {
  const startedAt = Date.now();
  let response: { data: Shift | null; error: { message: string } | null };
  try {
    response = await supabaseDirect.from('shifts').select('*').eq('id', shiftId).maybeSingle();
  } catch (err: any) {
    logShiftWriteOutcome({
      operation: 'direct-confirmation-read',
      elapsedMs: Date.now() - startedAt,
      outcome: 'network-error',
      shiftId,
      message: err?.message ?? String(err),
    });
    return { status: 'unknown' };
  }

  if (response.error) {
    logShiftWriteOutcome({
      operation: 'direct-confirmation-read',
      elapsedMs: Date.now() - startedAt,
      outcome: 'supabase-error',
      shiftId,
      message: response.error.message,
    });
    return { status: 'unknown' };
  }

  logShiftWriteOutcome({
    operation: 'direct-confirmation-read',
    elapsedMs: Date.now() - startedAt,
    outcome: 'success',
    shiftId,
  });
  return response.data ? { status: 'found', shift: response.data } : { status: 'not_found' };
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

// Весь критический путь открытия/закрытия смены теперь идёт через
// supabaseDirect, в обход прокси ssd-api.ru, включая INSERT/UPDATE и все
// confirmation-read. Это осознанный компромисс: прокси подтверждённо может
// давать задержку 2+ минуты даже на простых запросах, что несовместимо с UX
// создания и закрытия смены. Обратная сторона: сотрудники на мобильных
// операторах, блокирующих прямой доступ к *.supabase.co, не смогут открыть
// или закрыть смену через этот flow вовсе, а не просто будут ждать дольше.
// Обычные списочные чтения — включая getTodayOpenShift() для главного
// экрана, knowledge base и другие некритичные экраны — остаются на прокси и
// не затронуты этим решением.
//
// Closes the given shift row in place — never creates a new row.
export async function closeShift(
  shiftId: number,
  params: { equipmentOk: boolean | null; notes: string }
): Promise<void> {
  const startedAt = Date.now();
  let error: { message: string } | null = null;
  try {
    const result = await supabaseDirect
      .from('shifts')
      .update({
        end_time: new Date().toISOString(),
        status: 'closed',
        end_equipment_ok: params.equipmentOk,
        end_notes: params.notes || null,
      })
      .eq('id', shiftId);
    error = result.error;
  } catch (err: any) {
    logShiftWriteOutcome({
      operation: 'close-shift-update',
      elapsedMs: Date.now() - startedAt,
      outcome: 'network-error',
      shiftId,
      message: err?.message ?? String(err),
    });
    throw err;
  }

  if (error) {
    logShiftWriteOutcome({
      operation: 'close-shift-update',
      elapsedMs: Date.now() - startedAt,
      outcome: 'supabase-error',
      shiftId,
      message: error.message,
    });
    throw error;
  }

  logShiftWriteOutcome({
    operation: 'close-shift-update',
    elapsedMs: Date.now() - startedAt,
    outcome: 'success',
    shiftId,
  });
}

export type PhotoUploadResult = { objectPath: string; publicUrl: string };

// Uploads the start-of-shift photo to the shift-photos bucket and returns
// its confirmed object path and public URL. Uses `supabaseDirect` (bypasses
// the ssd-api.ru proxy) because large uploads through the proxy stall
// indefinitely on some mobile networks — see lib/supabase.ts.
export async function uploadStartShiftPhoto(
  deviceId: string,
  localUri: string
): Promise<PhotoUploadResult> {
  const objectPath = `${deviceId}_${todayIsoDate()}.jpg`;
  const bucket = 'shift-photos';
  const mimeType = 'image/jpeg';

  console.log('[PhotoUpload] before-local-fetch', 'scheme=', localUri?.split(':')[0], Date.now());
  let response: Response;
  try {
    response = await fetch(localUri);
  } catch (err: any) {
    logOperationFailure({
      operation: 'local-fetch',
      bucket,
      objectPath,
      mimeType,
      message: err?.message ?? String(err),
    });
    throw err;
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await response.arrayBuffer();
  } catch (err: any) {
    logOperationFailure({
      operation: 'local-fetch-read-body',
      status: response.status,
      bucket,
      objectPath,
      mimeType,
      message: err?.message ?? String(err),
    });
    throw err;
  }
  console.log('[PhotoUpload] after-array-buffer', 'byteLength=', arrayBuffer.byteLength, Date.now());

  console.log(
    '[PhotoUpload] before-storage-upload',
    'objectPath=', objectPath,
    'byteLength=', arrayBuffer.byteLength,
    Date.now()
  );
  type UploadErrorShape = { message: string; statusCode?: string; status?: number } | null;
  let uploadError: UploadErrorShape = null;
  try {
    const result = await supabaseDirect.storage.from(bucket).upload(objectPath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    });
    uploadError = result.error as UploadErrorShape;
  } catch (err: any) {
    // A raw network-level throw (e.g. Safari's "TypeError: Load failed")
    // rather than a structured { error } response from the SDK.
    console.log('[PhotoUpload] after-storage-upload', 'threw=', err?.message ?? err, Date.now());
    logOperationFailure({
      operation: 'storage-upload',
      bucket,
      objectPath,
      mimeType,
      fileSize: arrayBuffer.byteLength,
      message: err?.message ?? String(err),
    });
    throw err;
  }
  console.log('[PhotoUpload] after-storage-upload', 'error=', uploadError?.message ?? null, Date.now());

  if (uploadError) {
    logOperationFailure({
      operation: 'storage-upload',
      status: uploadError.statusCode ?? uploadError.status,
      bucket,
      objectPath,
      mimeType,
      fileSize: arrayBuffer.byteLength,
      message: uploadError.message,
    });
    throw uploadError;
  }

  const { data } = supabaseDirect.storage.from(bucket).getPublicUrl(objectPath);
  return { objectPath, publicUrl: data.publicUrl };
}

export type EnsureOpenShiftParams = {
  deviceId: string;
  fullName: string;
  objectName: string;
  photoPublicUrl: string;
  // A shiftId already known from a previous (possibly interrupted) attempt.
  // When present, this call NEVER inserts a fresh row until this id has been
  // checked and found not to already be today's open shift.
  existingShiftId: number | null;
};

export type EnsureOpenShiftResult =
  | { ok: true; shiftId: number }
  // `shiftId` here is set whenever we now know an id worth remembering for
  // the next retry (e.g. the insert itself succeeded but confirmation could
  // not be verified) — the caller should store it so a retry never inserts
  // a second row. `null` means nothing was created yet; a retry can safely
  // re-run this whole function from scratch.
  | { ok: false; shiftId: number | null; message: string };

// Весь критический путь открытия/закрытия смены теперь идёт через
// supabaseDirect, в обход прокси ssd-api.ru, включая INSERT/UPDATE и все
// confirmation-read. Это осознанный компромисс: прокси подтверждённо может
// давать задержку 2+ минуты даже на простых запросах, что несовместимо с UX
// создания и закрытия смены. Обратная сторона: сотрудники на мобильных
// операторах, блокирующих прямой доступ к *.supabase.co, не смогут открыть
// или закрыть смену через этот flow вовсе, а не просто будут ждать дольше.
// Обычные списочные чтения — включая getTodayOpenShift() для главного
// экрана, knowledge base и другие некритичные экраны — остаются на прокси и
// не затронуты этим решением.
//
// Idempotently ensures exactly one open shift exists for today for this
// device, creating one only when the server has confirmed none already
// exists. Every path re-reads the row back by id before reporting success —
// an insert/update's own `{ error: null }` response is never, by itself,
// treated as proof that the row exists and is correct.
export async function ensureOpenShift(params: EnsureOpenShiftParams): Promise<EnsureOpenShiftResult> {
  const { deviceId, fullName, objectName, photoPublicUrl, existingShiftId } = params;

  if (existingShiftId) {
    const confirmed = await getShiftByIdDirect(existingShiftId);

    if (
      confirmed.status === 'found' &&
      confirmed.shift.status === 'open' &&
      confirmed.shift.shift_date === todayIsoDate()
    ) {
      return { ok: true, shiftId: existingShiftId };
    }
    if (confirmed.status === 'unknown') {
      return {
        ok: false,
        shiftId: existingShiftId,
        message: 'Не удалось подтвердить статус смены. Проверьте подключение и повторите.',
      };
    }
    // 'not_found', or found but closed/stale-day — fall through and check
    // for today's shift fresh, below.
  }

  // Before creating a new row, confirm the server doesn't already have an
  // open shift for today — covers the case where an earlier attempt's
  // INSERT actually landed but its response never reached the client
  // (e.g. "TypeError: Load failed" after the request was already sent).
  const existing = await getTodayOpenShiftDirect(deviceId);
  if (existing.status === 'unknown') {
    return {
      ok: false,
      shiftId: existingShiftId,
      message: 'Не удалось проверить статус смены. Проверьте подключение и повторите.',
    };
  }
  if (existing.status === 'open') {
    return { ok: true, shiftId: existing.shift.id };
  }

  // status === 'none' — the direct client has confirmed no open shift
  // exists today, so it's safe to insert.
  const startedAt = Date.now();
  let inserted: Shift | undefined;
  let insertError: { message: string; code?: string } | null = null;
  try {
    const result = await supabaseDirect
      .from('shifts')
      .insert({
        telegram_chat_id: deviceId,
        full_name: fullName,
        object_name: objectName,
        start_time: new Date().toISOString(),
        start_photo_url: photoPublicUrl,
        status: 'open',
        shift_date: todayIsoDate(),
      })
      .select()
      .single();
    inserted = result.data ?? undefined;
    insertError = result.error;
  } catch (err: any) {
    logShiftWriteOutcome({
      operation: 'shift-insert',
      elapsedMs: Date.now() - startedAt,
      outcome: 'network-error',
      message: err?.message ?? String(err),
    });
    return {
      ok: false,
      shiftId: null,
      message: err?.message ?? 'Не удалось сохранить данные. Проверьте подключение и попробуйте снова.',
    };
  }

  if (insertError) {
    logShiftWriteOutcome({
      operation: 'shift-insert',
      elapsedMs: Date.now() - startedAt,
      outcome: 'supabase-error',
      message: insertError.message,
    });
    return { ok: false, shiftId: null, message: insertError.message };
  }
  if (!inserted?.id) {
    logShiftWriteOutcome({
      operation: 'shift-insert',
      elapsedMs: Date.now() - startedAt,
      outcome: 'supabase-error',
      message: 'Insert returned no error but also no row id.',
    });
    return { ok: false, shiftId: null, message: 'Сервер не вернул идентификатор смены.' };
  }

  logShiftWriteOutcome({
    operation: 'shift-insert',
    elapsedMs: Date.now() - startedAt,
    outcome: 'success',
    shiftId: inserted.id,
  });

  const confirmation = await getShiftByIdDirect(inserted.id);

  if (confirmation.status === 'unknown') {
    // The insert itself returned a real id with no error — remember it so a
    // retry only confirms, never inserts a second row.
    return {
      ok: false,
      shiftId: inserted.id,
      message:
        'Смена создана, но не удалось подтвердить это с сервером. Проверьте подключение и нажмите «Повторить».',
    };
  }
  if (confirmation.status === 'not_found' || confirmation.shift.status !== 'open') {
    return {
      ok: false,
      shiftId: inserted.id,
      message: 'Не удалось подтвердить создание смены. Попробуйте снова.',
    };
  }

  return { ok: true, shiftId: inserted.id };
}

import { supabase, supabaseDirect, Shift } from './supabase';
import { todayIsoDate } from './date';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';
import type { ShiftByIdResult } from './shifts';

// ---- Dashboard (Обзор) ----

export type DashboardStats = {
  openShiftsToday: number;
  newIncidents: number;
  highUrgencyToday: number;
  residentQuestionsToday: number;
  employeeFeedbackToday: number;
};

// Falls back to all-zero stats if the network stalls — each count is raced
// independently so a stall on one doesn't hold back the others.
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = todayIsoDate();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [openShifts, newIncidents, highUrgency, residentQuestions, employeeFeedback] =
    await Promise.all([
      raceWithTimeout(
        supabase
          .from('shifts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')
          .eq('shift_date', today),
        DEFAULT_QUERY_TIMEOUT_MS,
        'getDashboardStats.openShifts'
      ),
      raceWithTimeout(
        supabase
          .from('incidents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new'),
        DEFAULT_QUERY_TIMEOUT_MS,
        'getDashboardStats.newIncidents'
      ),
      raceWithTimeout(
        supabase
          .from('incidents')
          .select('id', { count: 'exact', head: true })
          .eq('urgency', 'Высокая')
          .eq('shift_date', today),
        DEFAULT_QUERY_TIMEOUT_MS,
        'getDashboardStats.highUrgency'
      ),
      raceWithTimeout(
        supabase
          .from('resident_questions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString()),
        DEFAULT_QUERY_TIMEOUT_MS,
        'getDashboardStats.residentQuestions'
      ),
      raceWithTimeout(
        supabase
          .from('employee_feedback')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString()),
        DEFAULT_QUERY_TIMEOUT_MS,
        'getDashboardStats.employeeFeedback'
      ),
    ]);

  if (!openShifts.timedOut && openShifts.error) throw openShifts.error;
  if (!newIncidents.timedOut && newIncidents.error) throw newIncidents.error;
  if (!highUrgency.timedOut && highUrgency.error) throw highUrgency.error;
  if (!residentQuestions.timedOut && residentQuestions.error) throw residentQuestions.error;
  if (!employeeFeedback.timedOut && employeeFeedback.error) throw employeeFeedback.error;

  return {
    openShiftsToday: openShifts.timedOut ? 0 : openShifts.count ?? 0,
    newIncidents: newIncidents.timedOut ? 0 : newIncidents.count ?? 0,
    highUrgencyToday: highUrgency.timedOut ? 0 : highUrgency.count ?? 0,
    residentQuestionsToday: residentQuestions.timedOut ? 0 : residentQuestions.count ?? 0,
    employeeFeedbackToday: employeeFeedback.timedOut ? 0 : employeeFeedback.count ?? 0,
  };
}

// ---- Shifts (Смены) ----

export type ShiftStatusFilter = 'all' | 'open' | 'closed';

export type ShiftsFilter = {
  date: string | null; // YYYY-MM-DD, null = all dates
  objectName: string | null; // null = all objects
  status: ShiftStatusFilter;
};

// Reads shifts directly (bypasses the ssd-api.ru proxy) for the supervisor
// journal — same rationale as the employee critical flow in lib/shifts.ts:
// the proxy has confirmed latency well beyond a normal read budget, and
// silently falling back to an empty list on timeout previously made a real
// "couldn't load" condition indistinguishable from "no shifts match these
// filters". A timeout or network/Supabase error is now surfaced as a thrown
// error instead, so the screen's existing error state can show it correctly
// rather than a false empty-list.
export async function getShifts(filter: ShiftsFilter): Promise<Shift[]> {
  let query = supabaseDirect.from('shifts').select('*');

  if (filter.date) {
    query = query.eq('shift_date', filter.date);
  }
  if (filter.objectName) {
    query = query.eq('object_name', filter.objectName);
  }
  if (filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }

  let response: { data: Shift[] | null; error: { message: string } | null };
  try {
    response = await query
      .order('shift_date', { ascending: false })
      .order('start_time', { ascending: false });
  } catch (err: any) {
    throw new Error(
      err?.message ?? 'Не удалось загрузить смены. Проверьте подключение и попробуйте снова.'
    );
  }

  if (response.error) throw new Error(response.error.message);
  return response.data ?? [];
}

// Direct-client read for a single shift by id, used by the supervisor
// shift-detail screen. Returns a discriminated result instead of `Shift |
// null`: `not_found` is only ever returned when the server has confirmed no
// row exists for this id — a timeout or network/Supabase error resolves to
// `unknown` instead, and must never be shown to the user as "shift not
// found".
export async function getShiftById(id: number): Promise<ShiftByIdResult> {
  let response: { data: Shift | null; error: { message: string } | null };
  try {
    response = await supabaseDirect.from('shifts').select('*').eq('id', id).maybeSingle();
  } catch {
    return { status: 'unknown' };
  }

  if (response.error) return { status: 'unknown' };
  return response.data ? { status: 'found', shift: response.data } : { status: 'not_found' };
}

// Distinct object names across all shifts, for the object filter options.
// Same direct-client + throw-on-failure rationale as getShifts above.
export async function getDistinctObjectNames(): Promise<string[]> {
  let response: { data: { object_name: string }[] | null; error: { message: string } | null };
  try {
    response = await supabaseDirect.from('shifts').select('object_name');
  } catch (err: any) {
    throw new Error(err?.message ?? 'Не удалось загрузить список объектов.');
  }

  if (response.error) throw new Error(response.error.message);
  const set = new Set((response.data ?? []).map((row) => row.object_name).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
}

import { supabase, Shift } from './supabase';
import { todayIsoDate } from './date';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

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

// Falls back to an empty list if the network stalls.
export async function getShifts(filter: ShiftsFilter): Promise<Shift[]> {
  let query = supabase.from('shifts').select('*');

  if (filter.date) {
    query = query.eq('shift_date', filter.date);
  }
  if (filter.objectName) {
    query = query.eq('object_name', filter.objectName);
  }
  if (filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }

  const result = await raceWithTimeout(
    query.order('shift_date', { ascending: false }).order('start_time', { ascending: false }),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getShifts'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

// Falls back to `null` if the network stalls.
export async function getShiftById(id: number): Promise<Shift | null> {
  const result = await raceWithTimeout(
    supabase.from('shifts').select('*').eq('id', id).maybeSingle(),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getShiftById'
  );

  if (result.timedOut) return null;
  if (result.error) throw result.error;
  return result.data;
}

// Distinct object names across all shifts, for the object filter options.
// Falls back to an empty list if the network stalls.
export async function getDistinctObjectNames(): Promise<string[]> {
  const result = await raceWithTimeout(
    supabase.from('shifts').select('object_name'),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getDistinctObjectNames'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  const set = new Set((result.data ?? []).map((row) => row.object_name).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
}

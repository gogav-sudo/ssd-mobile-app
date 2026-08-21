import { supabase, Employee, Shift, Incident } from './supabase';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

// Falls back to an empty list if the network stalls.
export async function getAllEmployees(): Promise<Employee[]> {
  const result = await raceWithTimeout(
    supabase.from('employees').select('*').order('created_at', { ascending: false }),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getAllEmployees'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

// Falls back to `null` if the network stalls.
export async function getEmployeeById(id: number): Promise<Employee | null> {
  const result = await raceWithTimeout(
    supabase.from('employees').select('*').eq('id', id).maybeSingle(),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getEmployeeById'
  );

  if (result.timedOut) return null;
  if (result.error) throw result.error;
  return result.data;
}

export type EmployeeStats = {
  totalShifts: number;
  totalIncidents: number;
  recentShifts: Shift[];
  recentIncidents: Incident[];
};

// Falls back to all-empty stats if the network stalls — each of the four
// underlying queries is raced independently so a stall on one doesn't hold
// back the others.
export async function getEmployeeStats(telegramChatId: string): Promise<EmployeeStats> {
  const [shiftsCount, incidentsCount, recentShifts, recentIncidents] = await Promise.all([
    raceWithTimeout(
      supabase
        .from('shifts')
        .select('id', { count: 'exact', head: true })
        .eq('telegram_chat_id', telegramChatId),
      DEFAULT_QUERY_TIMEOUT_MS,
      'getEmployeeStats.shiftsCount'
    ),
    raceWithTimeout(
      supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true })
        .eq('telegram_chat_id', telegramChatId),
      DEFAULT_QUERY_TIMEOUT_MS,
      'getEmployeeStats.incidentsCount'
    ),
    raceWithTimeout(
      supabase
        .from('shifts')
        .select('*')
        .eq('telegram_chat_id', telegramChatId)
        .order('shift_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(5),
      DEFAULT_QUERY_TIMEOUT_MS,
      'getEmployeeStats.recentShifts'
    ),
    raceWithTimeout(
      supabase
        .from('incidents')
        .select('*')
        .eq('telegram_chat_id', telegramChatId)
        .order('created_at', { ascending: false })
        .limit(5),
      DEFAULT_QUERY_TIMEOUT_MS,
      'getEmployeeStats.recentIncidents'
    ),
  ]);

  if (!shiftsCount.timedOut && shiftsCount.error) throw shiftsCount.error;
  if (!incidentsCount.timedOut && incidentsCount.error) throw incidentsCount.error;
  if (!recentShifts.timedOut && recentShifts.error) throw recentShifts.error;
  if (!recentIncidents.timedOut && recentIncidents.error) throw recentIncidents.error;

  return {
    totalShifts: shiftsCount.timedOut ? 0 : shiftsCount.count ?? 0,
    totalIncidents: incidentsCount.timedOut ? 0 : incidentsCount.count ?? 0,
    recentShifts: recentShifts.timedOut ? [] : recentShifts.data ?? [],
    recentIncidents: recentIncidents.timedOut ? [] : recentIncidents.data ?? [],
  };
}

import { supabase, supabaseDirect, Incident } from './supabase';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

export type IncidentStatus = 'new' | 'in_progress' | 'resolved';

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  resolved: 'Решён',
};

export type IncidentUrgencyFilter = 'all' | 'Низкая' | 'Средняя' | 'Высокая';
export type IncidentStatusFilter = 'all' | IncidentStatus;

export type IncidentsFilter = {
  date: string | null; // YYYY-MM-DD, null = all dates
  objectName: string | null;
  status: IncidentStatusFilter;
  urgency: IncidentUrgencyFilter;
};

// Falls back to an empty list if the network stalls.
export async function getIncidents(filter: IncidentsFilter): Promise<Incident[]> {
  let query = supabase.from('incidents').select('*');

  if (filter.date) {
    query = query.eq('shift_date', filter.date);
  }
  if (filter.objectName) {
    query = query.eq('object_name', filter.objectName);
  }
  if (filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }
  if (filter.urgency !== 'all') {
    query = query.eq('urgency', filter.urgency);
  }

  const result = await raceWithTimeout(
    query.order('created_at', { ascending: false }),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getIncidents'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

// Direct-client read for a single incident by id, used by the supervisor
// incident-detail screen — same rationale and same discriminated-result
// shape as lib/supervisorData.ts's getShiftById: `not_found` is only ever
// returned when the server has confirmed no row exists for this id — a
// timeout or network/Supabase error resolves to `unknown` instead, and must
// never be shown to the user as "incident not found" (confirmed via
// read-only audit: the proxied `supabase` client was silently returning
// null on timeout here, making a real incident appear not to exist).
export type IncidentByIdResult =
  | { status: 'found'; incident: Incident }
  | { status: 'not_found' }
  | { status: 'unknown' };

export async function getIncidentById(id: number): Promise<IncidentByIdResult> {
  let response: { data: Incident | null; error: { message: string } | null };
  try {
    response = await supabaseDirect.from('incidents').select('*').eq('id', id).maybeSingle();
  } catch {
    return { status: 'unknown' };
  }

  if (response.error) return { status: 'unknown' };
  return response.data ? { status: 'found', incident: response.data } : { status: 'not_found' };
}

export async function updateIncidentStatus(id: number, status: IncidentStatus): Promise<void> {
  const { error } = await supabase.from('incidents').update({ status }).eq('id', id);
  if (error) throw error;
}

// Falls back to an empty list if the network stalls.
export async function getDistinctIncidentObjectNames(): Promise<string[]> {
  const result = await raceWithTimeout(
    supabase.from('incidents').select('object_name'),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getDistinctIncidentObjectNames'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  const set = new Set((result.data ?? []).map((row) => row.object_name).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
}

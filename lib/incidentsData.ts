import { supabase, Incident } from './supabase';
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

// Falls back to `null` if the network stalls.
export async function getIncidentById(id: number): Promise<Incident | null> {
  const result = await raceWithTimeout(
    supabase.from('incidents').select('*').eq('id', id).maybeSingle(),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getIncidentById'
  );

  if (result.timedOut) return null;
  if (result.error) throw result.error;
  return result.data;
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

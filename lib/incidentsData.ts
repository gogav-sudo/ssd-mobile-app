import { supabase, Incident } from './supabase';

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

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getIncidentById(id: number): Promise<Incident | null> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateIncidentStatus(id: number, status: IncidentStatus): Promise<void> {
  const { error } = await supabase.from('incidents').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function getDistinctIncidentObjectNames(): Promise<string[]> {
  const { data, error } = await supabase.from('incidents').select('object_name');
  if (error) throw error;
  const set = new Set((data ?? []).map((row) => row.object_name).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
}

import { supabase, Shift } from './supabase';
import { todayIsoDate } from './date';

// ---- Dashboard (Обзор) ----

export type DashboardStats = {
  openShiftsToday: number;
  newIncidents: number;
  highUrgencyToday: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = todayIsoDate();

  const [openShifts, newIncidents, highUrgency] = await Promise.all([
    supabase
      .from('shifts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
      .eq('shift_date', today),
    supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('urgency', 'Высокая')
      .eq('shift_date', today),
  ]);

  if (openShifts.error) throw openShifts.error;
  if (newIncidents.error) throw newIncidents.error;
  if (highUrgency.error) throw highUrgency.error;

  return {
    openShiftsToday: openShifts.count ?? 0,
    newIncidents: newIncidents.count ?? 0,
    highUrgencyToday: highUrgency.count ?? 0,
  };
}

// ---- Shifts (Смены) ----

export type ShiftStatusFilter = 'all' | 'open' | 'closed';

export type ShiftsFilter = {
  date: string | null; // YYYY-MM-DD, null = all dates
  objectName: string | null; // null = all objects
  status: ShiftStatusFilter;
};

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

  const { data, error } = await query
    .order('shift_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getShiftById(id: number): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Distinct object names across all shifts, for the object filter options.
export async function getDistinctObjectNames(): Promise<string[]> {
  const { data, error } = await supabase.from('shifts').select('object_name');
  if (error) throw error;
  const set = new Set((data ?? []).map((row) => row.object_name).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
}

import { supabase, Employee, Shift, Incident } from './supabase';

export async function getAllEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getEmployeeById(id: number): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type EmployeeStats = {
  totalShifts: number;
  totalIncidents: number;
  recentShifts: Shift[];
  recentIncidents: Incident[];
};

export async function getEmployeeStats(telegramChatId: string): Promise<EmployeeStats> {
  const [shiftsCount, incidentsCount, recentShifts, recentIncidents] = await Promise.all([
    supabase
      .from('shifts')
      .select('id', { count: 'exact', head: true })
      .eq('telegram_chat_id', telegramChatId),
    supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('telegram_chat_id', telegramChatId),
    supabase
      .from('shifts')
      .select('*')
      .eq('telegram_chat_id', telegramChatId)
      .order('shift_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(5),
    supabase
      .from('incidents')
      .select('*')
      .eq('telegram_chat_id', telegramChatId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (shiftsCount.error) throw shiftsCount.error;
  if (incidentsCount.error) throw incidentsCount.error;
  if (recentShifts.error) throw recentShifts.error;
  if (recentIncidents.error) throw recentIncidents.error;

  return {
    totalShifts: shiftsCount.count ?? 0,
    totalIncidents: incidentsCount.count ?? 0,
    recentShifts: recentShifts.data ?? [],
    recentIncidents: recentIncidents.data ?? [],
  };
}

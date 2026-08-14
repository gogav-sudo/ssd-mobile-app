import { supabase, EmployeeFeedback } from './supabase';
import { todayIsoDate } from './date';

export type FeedbackType = 'blocker' | 'improvement';

export type NewEmployeeFeedbackInput = {
  telegramChatId: string;
  fullName: string;
  objectName: string;
  feedbackType: FeedbackType;
  feedbackText: string;
};

export async function createEmployeeFeedback(
  input: NewEmployeeFeedbackInput
): Promise<EmployeeFeedback> {
  const { data, error } = await supabase
    .from('employee_feedback')
    .insert({
      telegram_chat_id: input.telegramChatId,
      full_name: input.fullName,
      object_name: input.objectName,
      feedback_type: input.feedbackType,
      feedback_text: input.feedbackText,
      shift_date: todayIsoDate(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---- Supervisor journal (Ответы сотрудников) ----

export type FeedbackTypeFilter = 'all' | FeedbackType;

export type EmployeeFeedbackFilter = {
  dateFrom: string | null; // YYYY-MM-DD, null = no lower bound
  dateTo: string | null; // YYYY-MM-DD, null = no upper bound
  feedbackType: FeedbackTypeFilter;
};

// Chronological list for supervisors, with optional type + date-range filters.
export async function getEmployeeFeedback(
  filter: EmployeeFeedbackFilter
): Promise<EmployeeFeedback[]> {
  let query = supabase.from('employee_feedback').select('*');

  if (filter.feedbackType !== 'all') {
    query = query.eq('feedback_type', filter.feedbackType);
  }
  if (filter.dateFrom) {
    query = query.gte('created_at', `${filter.dateFrom}T00:00:00`);
  }
  if (filter.dateTo) {
    query = query.lte('created_at', `${filter.dateTo}T23:59:59`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Count of feedback entries created since the start of today (device-local),
// used for the dashboard link card.
export async function getEmployeeFeedbackTodayCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('employee_feedback')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString());

  if (error) throw error;
  return count ?? 0;
}

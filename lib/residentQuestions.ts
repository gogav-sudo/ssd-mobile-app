import { supabase, ResidentQuestion } from './supabase';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

export type NewResidentQuestionInput = {
  telegramChatId: string;
  fullName: string;
  objectName: string;
  questionText: string;
};

export async function createResidentQuestion(
  input: NewResidentQuestionInput
): Promise<ResidentQuestion> {
  const { data, error } = await supabase
    .from('resident_questions')
    .insert({
      telegram_chat_id: input.telegramChatId,
      full_name: input.fullName,
      object_name: input.objectName,
      question_text: input.questionText,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Returns today's questions logged by this device, newest first.
// Falls back to an empty list if the network stalls.
export async function getTodayResidentQuestions(
  deviceId: string
): Promise<ResidentQuestion[]> {
  if (!deviceId) {
    throw new Error('getTodayResidentQuestions requires a device identity id.');
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await raceWithTimeout(
    supabase
      .from('resident_questions')
      .select('*')
      .eq('telegram_chat_id', deviceId)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: false }),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getTodayResidentQuestions'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

export type ResidentQuestionsFilter = {
  dateFrom: string | null; // YYYY-MM-DD, null = no lower bound
  dateTo: string | null; // YYYY-MM-DD, null = no upper bound
  objectName: string | null;
};

// Chronological list for supervisors, with optional object + date-range filters.
// Falls back to an empty list if the network stalls.
export async function getResidentQuestions(
  filter: ResidentQuestionsFilter
): Promise<ResidentQuestion[]> {
  let query = supabase.from('resident_questions').select('*');

  if (filter.objectName) {
    query = query.eq('object_name', filter.objectName);
  }
  if (filter.dateFrom) {
    query = query.gte('created_at', `${filter.dateFrom}T00:00:00`);
  }
  if (filter.dateTo) {
    query = query.lte('created_at', `${filter.dateTo}T23:59:59`);
  }

  const result = await raceWithTimeout(
    query.order('created_at', { ascending: false }),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getResidentQuestions'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function getDistinctResidentQuestionObjectNames(): Promise<string[]> {
  const result = await raceWithTimeout(
    supabase.from('resident_questions').select('object_name'),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getDistinctResidentQuestionObjectNames'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  const set = new Set((result.data ?? []).map((row) => row.object_name).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
}

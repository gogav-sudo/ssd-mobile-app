import { supabase, supabaseDirect, ResidentQuestion } from './supabase';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

export type NewResidentQuestionInput = {
  telegramChatId: string;
  fullName: string;
  objectName: string;
  questionText: string;
};

// Safe, structured diagnostics for this insert. Deliberately limited to
// fields that can never contain secrets or personal data: operation name,
// elapsed time, outcome, and a short technical message. Never pass a URL,
// query params, tokens, `.env` values, the question text, employee name/id,
// or any other personal data into this.
export type QuestionSaveOutcome = 'success' | 'timeout' | 'network-error' | 'supabase-error';

export type QuestionSaveDiagnostics = {
  operation: string;
  elapsedMs: number;
  outcome: QuestionSaveOutcome;
  message?: string;
};

export function logQuestionSaveOutcome(diag: QuestionSaveDiagnostics): void {
  console.log('[ResidentQuestionPersistence]', diag);
}

// Uses supabaseDirect (bypasses the ssd-api.ru proxy) — the proxy has
// confirmed occasional latency far beyond a normal read/write budget, which
// previously caused the screen's own timeout to fire while this insert was
// still in flight (and, in at least one observed case, ended up creating a
// duplicate row after the user retried). Every other resident_questions
// read in this file stays on `supabase`, unchanged.
export async function createResidentQuestion(
  input: NewResidentQuestionInput
): Promise<ResidentQuestion> {
  const startedAt = Date.now();
  let response: { data: ResidentQuestion | null; error: { message: string } | null };
  try {
    response = await supabaseDirect
      .from('resident_questions')
      .insert({
        telegram_chat_id: input.telegramChatId,
        full_name: input.fullName,
        object_name: input.objectName,
        question_text: input.questionText,
      })
      .select()
      .single();
  } catch (err: any) {
    logQuestionSaveOutcome({
      operation: 'question-insert',
      elapsedMs: Date.now() - startedAt,
      outcome: 'network-error',
      message: err?.message ?? String(err),
    });
    throw err;
  }

  if (response.error) {
    logQuestionSaveOutcome({
      operation: 'question-insert',
      elapsedMs: Date.now() - startedAt,
      outcome: 'supabase-error',
      message: response.error.message,
    });
    throw response.error;
  }

  logQuestionSaveOutcome({
    operation: 'question-insert',
    elapsedMs: Date.now() - startedAt,
    outcome: 'success',
  });
  return response.data!;
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

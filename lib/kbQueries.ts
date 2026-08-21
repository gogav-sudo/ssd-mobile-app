import { supabase } from './supabase';
import { raceWithTimeout, DEFAULT_QUERY_TIMEOUT_MS } from './withFallbackTimeout';

export type KbQuery = {
  id: number;
  created_at: string;
  telegram_chat_id: string | null;
  full_name: string | null;
  question: string | null;
  matched_title: string | null;
  status: string | null;
};

// Falls back to an empty list if the network stalls.
export async function getRecentKbQueries(limit = 30): Promise<KbQuery[]> {
  const result = await raceWithTimeout(
    supabase.from('kb_queries').select('*').order('created_at', { ascending: false }).limit(limit),
    DEFAULT_QUERY_TIMEOUT_MS,
    'getRecentKbQueries'
  );

  if (result.timedOut) return [];
  if (result.error) throw result.error;
  return result.data ?? [];
}

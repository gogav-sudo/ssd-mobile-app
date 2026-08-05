import { supabase } from './supabase';

export type KbQuery = {
  id: number;
  created_at: string;
  telegram_chat_id: string | null;
  full_name: string | null;
  question: string | null;
  matched_title: string | null;
  status: string | null;
};

export async function getRecentKbQueries(limit = 30): Promise<KbQuery[]> {
  const { data, error } = await supabase
    .from('kb_queries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

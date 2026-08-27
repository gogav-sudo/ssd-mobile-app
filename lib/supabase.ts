import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

console.log('[supabase.ts] Module evaluating — reading env vars.');

// Proxied through a Cloudflare Worker at a Russian domain because mobile
// carriers in Russia block direct access to *.supabase.co.
const supabaseUrl = 'https://ssd-api.ru';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

console.log(
  '[supabase.ts] URL configured:',
  Boolean(supabaseUrl),
  'Anon key configured:',
  Boolean(supabaseAnonKey)
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Dedicated client that bypasses the ssd-api.ru Cloudflare Worker proxy,
// for two separate confirmed issues:
// 1. Large Storage uploads (shift/incident photos) stall indefinitely
//    through the proxy on some mobile networks (confirmed via Chrome
//    DevTools: request stuck at "Stalled", 0 kB transferred).
// 2. The CORS preflight for at least one table PATCH (see
//    app/employee-start-shift/notes.tsx) hangs through the proxy on
//    Android (confirmed on-device).
// Every other request (auth, and all other table reads/writes) still goes
// through `supabase` above, unchanged.
export const supabaseDirect = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

console.log('[supabase.ts] createClient() returned — module fully evaluated.');

// ---- Types matching the existing schema (read/write only, never altered) ----

export type Employee = {
  id: number;
  created_at: string;
  telegram_chat_id: string;
  full_name: string;
  object_name: string;
  role: string;
};

export type Shift = {
  id: number;
  created_at: string;
  telegram_chat_id: string;
  full_name: string;
  object_name: string;
  start_time: string;
  start_photo_url: string | null;
  start_uniform_ok: boolean | null;
  start_equipment_ok: boolean | null;
  start_notes: string | null;
  end_time: string | null;
  end_equipment_ok: boolean | null;
  end_notes: string | null;
  status: 'open' | 'closed';
  shift_date: string;
};

export type Incident = {
  id: number;
  created_at: string;
  telegram_chat_id: string;
  full_name: string;
  object_name: string;
  photo_url: string | null;
  description: string;
  urgency: 'Низкая' | 'Средняя' | 'Высокая';
  incident_type: string;
  shift_date: string;
  status: string;
};

export type EmployeeFeedback = {
  id: number;
  created_at: string;
  telegram_chat_id: string;
  full_name: string;
  object_name: string;
  feedback_type: 'blocker' | 'improvement';
  feedback_text: string;
  shift_date: string;
};

export type ResidentQuestion = {
  id: number;
  created_at: string;
  telegram_chat_id: string;
  full_name: string;
  object_name: string;
  question_text: string;
};

export type KnowledgeBaseEntry = {
  id: number;
  created_at: string;
  category: string;
  title: string;
  question: string;
  answer: string;
  forbidden: string | null;
  example_good: string | null;
  example_bad: string | null;
  keywords: string;
  priority: number;
  is_active: boolean;
};

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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

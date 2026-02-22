import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseEnabled) {
  // eslint-disable-next-line no-console
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

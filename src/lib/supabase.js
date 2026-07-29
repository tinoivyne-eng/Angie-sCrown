import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'Missing Supabase env vars. Copy .env.example to .env, fill in ' +
    'REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY, then restart `npm start`.'
  );
}

// Fall back to placeholder values so createClient doesn't throw and crash the
// whole app before we can show a helpful message. Real calls will simply fail.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
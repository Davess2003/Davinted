import { createClient } from '@supabase/supabase-js';

// Frontend Supabase client — used ONLY for auth (signup/login/session).
// All data reads/writes go through the Express API (see src/lib/db.js).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True once you've added your Supabase keys to .env. Until then the app runs
// in local/demo mode (localStorage + mock data) with no login required.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

// The current access token (JWT) for authenticating API calls, or null.
export async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

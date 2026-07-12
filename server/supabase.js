import { createClient } from '@supabase/supabase-js';

// Admin (service-role) Supabase client. Bypasses RLS — used only on the server.
// Null until SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set in server/.env.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && serviceKey);

export const supabaseAdmin = isSupabaseConfigured
  ? createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// Express guard: 503 until Supabase is configured (mirrors the Stripe guard).
export function requireSupabase(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error:
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env and restart.',
      code: 'supabase_not_configured'
    });
  }
  next();
}

// Express guard: verify the caller's Supabase JWT (sent as `Authorization:
// Bearer <access_token>`) and attach req.userId / req.userEmail.
export async function requireAuth(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase is not configured.', code: 'supabase_not_configured' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token.', code: 'no_token' });
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired session.', code: 'bad_token' });
  }
  req.userId = data.user.id;
  req.userEmail = data.user.email;
  next();
}

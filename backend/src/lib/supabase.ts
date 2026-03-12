import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/**
 * Server-side Supabase client using the **service_role** key.
 * This bypasses RLS — only use it inside trusted backend code.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

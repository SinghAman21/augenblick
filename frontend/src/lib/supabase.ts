import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_API_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_API_KEY as string | undefined);

if (!SUPABASE_URL || !SUPABASE_API_KEY) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).",
  );
}

export function getSupabaseClient(clerkToken?: string | null) {
  return createClient(SUPABASE_URL, SUPABASE_API_KEY, {
    global: {
      headers: clerkToken ? { Authorization: "Bearer " + clerkToken } : {},
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const supabase = getSupabaseClient();

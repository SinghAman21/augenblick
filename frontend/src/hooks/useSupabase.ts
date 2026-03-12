import { useSession } from "@clerk/react";
import { useMemo } from "react";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Returns a Supabase client pre-authorized with the current Clerk session token.
 * The token is fetched using the "supabase" JWT template you created in Clerk Dashboard.
 *
 * Example:
 *   const { supabase } = useSupabase();
 *   const { data } = await supabase.from("ideas").select("*");
 */
export function useSupabase() {
  const { session } = useSession();

  const supabase = useMemo(() => {
    return getSupabaseClient(); // start with anon client
  }, []);

  /**
   * Call this to get an authenticated client for a one-off query.
   * Automatically fetches the latest Clerk token.
   */
  async function getAuthenticatedClient() {
    const token = await session?.getToken({ template: "supabase" });
    return getSupabaseClient(token);
  }

  return { supabase, getAuthenticatedClient };
}

import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { createClient } from "@supabase/supabase-js";

/**
 * Syncs the signed-in Clerk user into the Supabase "profiles" table.
 * Uses the API key directly (service-role bypass) so no JWT template needed.
 * Call this once inside AppLayout so it runs on every authenticated page.
 */
export function useUpsertProfile() {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      console.log("[useUpsertProfile] Not ready:", { isLoaded, isSignedIn, hasUser: !!user });
      return;
    }

    async function syncProfile() {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key =
        (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
        (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
        (import.meta.env.VITE_SUPABASE_API_KEY as string | undefined);

      console.log("[useUpsertProfile] Supabase URL:", url);
      console.log("[useUpsertProfile] Key present:", !!key);

      if (!url || !key) {
        console.error("[useUpsertProfile] Missing Supabase env vars");
        return;
      }

      const db = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });

      const payload = {
        id: user!.id,
        email: user!.primaryEmailAddress?.emailAddress ?? "",
        display_name:
          user!.fullName ??
          user!.firstName ??
          user!.primaryEmailAddress?.emailAddress ??
          "Anonymous",
        updated_at: new Date().toISOString(),
      };

      console.log("[useUpsertProfile] Upserting:", payload);

      const { data, error } = await db
        .from("profiles")
        .upsert(payload, { onConflict: "id", ignoreDuplicates: false })
        .select();

      if (error) {
        console.error("[useUpsertProfile] FAILED:", error.message, "|", error.details, "|", error.hint);
      } else {
        console.log("[useUpsertProfile] SUCCESS:", data);
      }
    }

    syncProfile();
  }, [isLoaded, isSignedIn, user?.id]);
}

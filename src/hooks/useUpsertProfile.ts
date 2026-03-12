import { useEffect } from 'react';
import { useUser, useSession } from '@clerk/react';
import { createClient } from '@supabase/supabase-js';

export function useUpsertProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { session } = useSession();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !session) {
      console.log('[useUpsertProfile] Not ready:', { isLoaded, isSignedIn, hasUser: !!user, hasSession: !!session });
      return;
    }

    async function syncProfile() {
      try {
        console.log('[useUpsertProfile] Fetching Clerk token for Supabase...');
        const token = await session!.getToken({ template: 'supabase' });
        console.log('[useUpsertProfile] Token received:', token ? 'YES (length=' + token.length + ')' : 'NULL - Check Clerk JWT Template!');

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        console.log('[useUpsertProfile] Supabase URL:', SUPABASE_URL);

        const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: token ? { Authorization: 'Bearer ' + token } : {},
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        const payload = {
          id: user!.id,
          email: user!.primaryEmailAddress?.emailAddress ?? '',
          display_name: user!.fullName ?? user!.firstName ?? user!.primaryEmailAddress?.emailAddress ?? 'Anonymous',
          avatar_url: user!.imageUrl ?? null,
          updated_at: new Date().toISOString(),
        };

        console.log('[useUpsertProfile] Upserting profile:', payload);

        const { data, error } = await db
          .from('profiles')
          .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
          .select();

        if (error) {
          console.error('[useUpsertProfile] UPSERT FAILED:', error);
          console.error('[useUpsertProfile] Error details:', JSON.stringify(error, null, 2));
        } else {
          console.log('[useUpsertProfile] SUCCESS! Profile synced:', data);
        }
      } catch (err) {
        console.error('[useUpsertProfile] Unexpected error:', err);
      }
    }

    syncProfile();
  }, [isLoaded, isSignedIn, user?.id]);
}
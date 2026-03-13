import { AppLayout } from "@/components/app/AppLayout";
import { User } from "lucide-react";
import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    let cancelled = false;

    async function loadProfile() {
      const db = getSupabaseClient();
      const { data } = await db
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setProfileName(data?.display_name ?? null);
      setProfileEmail(data?.email ?? null);
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  const nameToShow =
    profileName?.trim() || user?.fullName?.trim() || user?.firstName?.trim() || user?.primaryEmailAddress?.emailAddress || "—";
  const emailToShow = profileEmail?.trim() || user?.primaryEmailAddress?.emailAddress || "—";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto">
        <h1 className="text-display text-2xl mb-6">Profile</h1>
        <div className="surface-raised p-5 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-primary/15 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{isLoaded ? nameToShow : "Loading..."}</h2>
            <p className="text-xs text-muted-foreground text-mono">{isLoaded ? emailToShow : "Loading..."}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
          {[{ label: "Sessions", val: "12" }, { label: "Ideas", val: "89" }, { label: "Votes", val: "234" }].map((s) => (
            <div key={s.label} className="surface-raised p-4 text-center">
              <p className="text-xl font-bold text-display">{s.val}</p>
              <p className="text-[10px] text-muted-foreground text-mono uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

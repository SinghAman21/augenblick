import { AppLayout } from "@/components/app/AppLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme, type ThemeId } from "@/contexts/ThemeContext";
import { Sun, Sparkles } from "lucide-react";
import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const THEMES: { id: ThemeId; label: string; description: string; icon: typeof Sun }[] = [
  { id: "default", label: "Dark Theme", description: "Dark theme with orange accents", icon: Sun },
  { id: "claude", label: "Light Theme", description: "Warm, light theme inspired by Claude AI", icon: Sparkles },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
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

  const displayName =
    profileName?.trim() ||
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "—";
  const email = profileEmail?.trim() || user?.primaryEmailAddress?.emailAddress || "—";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto">
        <h1 className="text-display text-2xl mb-6">Settings</h1>
        <div className="grid lg:grid-cols-2 gap-5 max-w-5xl">
          <div className="surface-raised p-5 space-y-4">
            <h3 className="text-mono text-xs text-muted-foreground uppercase tracking-widest">Appearance</h3>
            <div className="space-y-2">
              <Label className="text-xs">Color theme</Label>
              <div className="flex gap-2 flex-wrap">
                {THEMES.map(({ id, label, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all w-full min-w-[200px] ${
                      theme === id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/20 hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${theme === id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="surface-raised p-5 space-y-4">
            <h3 className="text-mono text-xs text-muted-foreground uppercase tracking-widest">General</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name</Label>
              <Input
                value={isLoaded ? displayName : "Loading..."}
                readOnly
                className="bg-muted/30 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                value={isLoaded ? email : "Loading..."}
                readOnly
                className="bg-muted/30 border-border"
              />
            </div>
          </div>
          <div className="surface-raised p-5 space-y-3 lg:col-span-2">
            <h3 className="text-mono text-xs text-muted-foreground uppercase tracking-widest">Notifications</h3>
            {["Email notifications", "Session updates", "AI suggestions"].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm">{item}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

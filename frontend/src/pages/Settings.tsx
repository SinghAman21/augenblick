import { AppLayout } from "@/components/app/AppLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto">
        <h1 className="text-display text-2xl mb-6">Settings</h1>
        <div className="grid lg:grid-cols-2 gap-5 max-w-5xl">
          <div className="surface-raised p-5 space-y-4">
            <h3 className="text-mono text-xs text-muted-foreground uppercase tracking-widest">General</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name</Label>
              <Input defaultValue="Demo User" className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input defaultValue="demo@idealab.app" className="bg-muted/30 border-border" />
            </div>
          </div>
          <div className="surface-raised p-5 space-y-3">
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

import { AppLayout } from "@/components/app/AppLayout";
import { User } from "lucide-react";

export default function Profile() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-xl">
        <h1 className="text-display text-2xl mb-6">Profile</h1>
        <div className="surface-raised p-5 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-primary/15 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Demo User</h2>
            <p className="text-xs text-muted-foreground text-mono">demo@idealab.app</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
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

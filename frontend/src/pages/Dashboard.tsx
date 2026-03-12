import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Lightbulb, Clock, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { api } from "@/lib/api";
import type { SelectSession } from "@/db/schema";

export default function Dashboard() {
  const [sessions, setSessions] = useState<SelectSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessions.list().then((res) => {
      setSessions(res.sessions);
      setTotal(res.total);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display text-2xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Your brainstorming sessions</p>
          </div>
          <Link to="/session/create">
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Session
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Active Sessions", value: String(total) },
            { label: "Total Ideas", value: "—" },
            { label: "Team Members", value: "—" },
            { label: "This Week", value: "—" },
          ].map((stat) => (
            <div key={stat.label} className="surface-raised p-4">
              <p className="text-xl font-bold text-display">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground text-mono uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sessions yet. Create your first one!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/session/${session.id}`}>
                  <div className="surface-raised p-4 hover:border-primary/30 transition-colors group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{session.title}</h3>
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground text-mono">
                      <span className="capitalize">{session.category}</span>
                      {session.is_private && <span className="text-primary/70">Private</span>}
                      <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" /> {new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

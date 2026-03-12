import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Lightbulb, Clock, MoreHorizontal, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/react";
import { createClient } from "@supabase/supabase-js";
import { AppLayout } from "@/components/app/AppLayout";

interface Session {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  status: string;
  created_at: string;
  memberCount: number;
  ideaCount: number;
}

const TAG_COLORS = ["tag-primary", "tag-secondary", "tag-accent"];

function timeAgo(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  return days + "d ago";
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function fetchSessions() {
      const db = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_API_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );

      // Fetch session IDs where this user is a member
      const { data: memberships, error: memErr } = await db
        .from("session_members")
        .select("session_id")
        .eq("user_id", user!.id);

      if (memErr) { setError(memErr.message); setLoading(false); return; }
      if (!memberships || memberships.length === 0) { setLoading(false); return; }

      const sessionIds = memberships.map((m: { session_id: string }) => m.session_id);

      // Fetch session rows
      const { data: rawSessions, error: sessErr } = await db
        .from("sessions")
        .select("id, title, description, category, is_private, status, created_at")
        .in("id", sessionIds)
        .order("created_at", { ascending: false });

      if (sessErr) { setError(sessErr.message); setLoading(false); return; }

      // Enrich each session with member + idea counts
      const enriched = await Promise.all(
        (rawSessions ?? []).map(async (s: { id: string; title: string; description: string | null; category: string | null; is_private: boolean; status: string; created_at: string }) => {
          const [{ count: memberCount }, { count: ideaCount }] = await Promise.all([
            db.from("session_members").select("*", { count: "exact", head: true }).eq("session_id", s.id),
            db.from("ideas").select("*", { count: "exact", head: true }).eq("session_id", s.id),
          ]);
          return { ...s, memberCount: memberCount ?? 0, ideaCount: ideaCount ?? 0 };
        })
      );

      setSessions(enriched);
      setLoading(false);
    }

    fetchSessions();
  }, [isLoaded, user]);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl">

        {/* Header */}
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Active Sessions", value: sessions.filter((s) => s.status === "active").length },
            { label: "Total Ideas",     value: sessions.reduce((a, s) => a + s.ideaCount, 0) },
            { label: "Team Members",    value: sessions.reduce((a, s) => a + s.memberCount, 0) },
            { label: "My Sessions",     value: sessions.length },
          ].map((stat) => (
            <div key={stat.label} className="surface-raised p-4">
              <p className="text-xl font-bold text-display">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground text-mono uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading sessions...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-4 py-3">
            Error: {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sessions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm mb-4">No sessions yet. Create your first one!</p>
            <Link to="/session/create">
              <button className="btn-primary flex items-center gap-2 text-sm mx-auto">
                <Plus className="w-4 h-4" /> New Session
              </button>
            </Link>
          </div>
        )}

        {/* Sessions grid */}
        {!loading && sessions.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={"/session/" + session.id}>
                  <div className="surface-raised p-4 hover:border-primary/30 transition-colors group cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {session.title}
                        </h3>
                        {session.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {session.description}
                          </p>
                        )}
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                    </div>

                    {session.category && (
                      <span className={TAG_COLORS[i % 3] + " text-[10px] mb-2 inline-block"}>
                        {session.category.charAt(0).toUpperCase() + session.category.slice(1)}
                      </span>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground text-mono mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {session.memberCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> {session.ideaCount}
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" /> {timeAgo(session.created_at)}
                      </span>
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

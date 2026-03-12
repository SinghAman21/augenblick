import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Lightbulb, Clock, MoreHorizontal, LayoutGrid, CalendarDays, ExternalLink, Link2, MessageCircle, ThumbsUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { AppLayout } from "@/components/app/AppLayout";
import { api, type SessionWithCounts } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type StatKey = "active_sessions" | "total_ideas" | "team_members" | "this_week";
const WIDGETS: { label: string; Icon: LucideIcon; valueKey: StatKey; accent: string }[] = [
  { label: "Active Sessions", Icon: LayoutGrid, valueKey: "active_sessions", accent: "text-violet-500 dark:text-violet-400" },
  { label: "Total Ideas", Icon: Lightbulb, valueKey: "total_ideas", accent: "text-amber-500 dark:text-amber-400" },
  { label: "Team Members", Icon: Users, valueKey: "team_members", accent: "text-emerald-500 dark:text-emerald-400" },
  { label: "This Week", Icon: CalendarDays, valueKey: "this_week", accent: "text-orange-500 dark:text-orange-400" },
];

function formatSessionDate(createdAt: string) {
  const d = new Date(createdAt);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

const EMOJI_REACTIONS = ["👍", "❤️", "🎯", "🔥", "💡"] as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [sessions, setSessions] = useState<SessionWithCounts[]>([]);
  const [total, setTotal] = useState(0);
  const [commentModalSession, setCommentModalSession] = useState<SessionWithCounts | null>(null);
  const [stats, setStats] = useState<{ active_sessions: number; total_ideas: number; team_members: number; this_week: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.sessions.list(50, 0, user?.id), api.dashboard.stats()])
      .then(([sessionsRes, statsRes]) => {
        setSessions(sessionsRes.sessions);
        setTotal(sessionsRes.total);
        setStats(statsRes.stats);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const getValue = (valueKey: StatKey) => {
    if (loading) return "…";
    if (stats == null) return valueKey === "active_sessions" ? String(total) : "—";
    return String(stats[valueKey]);
  };

  const copySessionLink = (sessionId: string) => {
    const url = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const openSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Your brainstorming sessions</p>
          </div>
          <Link to="/session/create">
            <button className="btn-primary flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2">
              <Plus className="w-4 h-4" /> New Session
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {WIDGETS.map(({ label, Icon, valueKey, accent }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group surface-raised rounded-xl p-5 border border-border/50 hover:border-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/80 group-hover:bg-muted transition-colors">
                  <Icon className={`h-5 w-5 ${accent}`} aria-hidden />
                </div>
                <p className={`text-2xl font-bold tabular-nums ${accent}`}>{getValue(valueKey)}</p>
              </div>
              <p className="text-[11px] text-muted-foreground text-mono uppercase tracking-wider mt-3">{label}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50 p-5 animate-pulse">
                <div className="h-5 w-3/4 rounded bg-muted mb-4" />
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-12 text-center">
            <p className="text-muted-foreground mb-4">No sessions yet. Create your first one!</p>
            <Link to="/session/create">
              <button className="btn-primary inline-flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2">
                <Plus className="w-4 h-4" /> New Session
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/session/${session.id}`} className="block h-full">
                  <div className="surface-raised rounded-xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors flex-1 min-w-0 truncate">
                        {session.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <button
                            type="button"
                            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
                            aria-label="Session actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => openSession(session.id)}>
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            Open session
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => copySessionLink(session.id)}>
                            <Link2 className="w-3.5 h-3.5 mr-2" />
                            Copy link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {session.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{session.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="capitalize font-medium">{session.category}</span>
                      {session.is_private && <span className="text-primary/80 text-[10px] uppercase">Private</span>}
                      <span className="flex items-center gap-1 shrink-0 ml-auto">
                        <Clock className="w-3 h-3" aria-hidden />
                        {formatSessionDate(session.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Votes on ideas">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{session.vote_count ?? 0}</span>
                      </span>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCommentModalSession(session);
                        }}
                        title="View and add comments"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{session.comment_count ?? 0}</span>
                      </button>
                      <div className="flex items-center gap-1 ml-auto">
                        {EMOJI_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="p-0.5 rounded text-sm opacity-70 hover:opacity-100 hover:bg-muted/80 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toast.success(`Reaction ${emoji} added`);
                            }}
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={!!commentModalSession} onOpenChange={(open) => !open && setCommentModalSession(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {commentModalSession ? `${commentModalSession.title} — Comments` : "Comments"}
              </DialogTitle>
            </DialogHeader>
            {commentModalSession && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This session has <strong>{commentModalSession.idea_count ?? 0}</strong> ideas and{" "}
                  <strong>{commentModalSession.comment_count ?? 0}</strong> comments. Open the session to view
                  discussions and add comments on ideas.
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      openSession(commentModalSession.id);
                      setCommentModalSession(null);
                    }}
                  >
                    Open session to comment
                  </Button>
                  <Button variant="outline" onClick={() => setCommentModalSession(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/app/AppLayout";
import { Share, Download, Plus, ThumbsUp, MessageCircle, Sparkles, Send, Lightbulb, Expand, Link2, FileText, GripVertical, Loader2, X, Check, Users as UsersIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import { createClient } from "@supabase/supabase-js";

const COLORS = ["idea-warm", "idea-teal", "idea-rose", "idea-sand", "idea-mint", "idea-coral"];

const aiTools = [
  { icon: Lightbulb, label: "Generate" },
  { icon: Expand,    label: "Expand"   },
  { icon: FileText,  label: "Summarize"},
  { icon: Link2,     label: "Related"  },
];

interface Idea {
  id: string;
  title: string;
  description: string | null;
  color: string;
  author_id: string;
  created_at: string;
  votes: number;
  comments: number;
}

export default function SessionWorkspace() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isLoaded } = useUser();

  const [ideas, setIdeas]         = useState<Idea[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isMember, setIsMember]   = useState(false);
  const [joining, setJoining]     = useState(false);
  
  const [aiOpen, setAiOpen]       = useState(false); // Default AI closed
  const [aiMessages]              = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Ready to brainstorm. Ask me to generate ideas or expand on existing ones." },
  ]);

  // Add Idea modal state
  const [showModal, setShowModal]   = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const [newDesc, setNewDesc]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  // Session meta
  const [sessionTitle, setSessionTitle] = useState("Loading...");
  
  // Share link state
  const [copied, setCopied] = useState(false);

  function getDb() {
    return createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_API_KEY,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
  }

  // Load session details + membership + ideas + Realtime WebSockets
  useEffect(() => {
    if (!sessionId || !isLoaded || !user) return;
    const db = getDb();
    let channel: ReturnType<typeof db.channel> | null = null;

    async function load() {
      // 1. Session title
      const { data: sess } = await db
        .from("sessions")
        .select("title")
        .eq("id", sessionId)
        .single();
      if (sess) setSessionTitle(sess.title);

      // 2. Check if user is a member
      const { data: membership } = await db
        .from("session_members")
        .select("role")
        .eq("session_id", sessionId)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!membership) {
        setIsMember(false);
        setLoading(false);
        return; // Don't try to fetch ideas or subscribe yet
      }

      setIsMember(true);

      // 3. Fetch Initial Ideas
      const { data: rawIdeas } = await db
        .from("ideas")
        .select("id, title, description, color, author_id, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (rawIdeas) {
        // Get vote + comment counts in parallel
        const enriched = await Promise.all(
          rawIdeas.map(async (idea: any) => {
            const [{ count: votes }, { count: comments }] = await Promise.all([
              db.from("idea_votes").select("*", { count: "exact", head: true }).eq("idea_id", idea.id),
              db.from("comments").select("*", { count: "exact", head: true }).eq("idea_id", idea.id),
            ]);
            return { ...idea, votes: votes ?? 0, comments: comments ?? 0 };
          })
        );
        setIdeas(enriched);
      }
      setLoading(false);

      // 4. Set up Realtime Subscription (WebSockets)
      channel = db.channel("ideas_" + sessionId)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ideas", filter: "session_id=eq." + sessionId },
          (payload) => {
            if (payload.eventType === "INSERT") {
              // Deduplicate since we also optimistically add it when creating
              setIdeas((prev) => {
                if (prev.find(i => i.id === payload.new.id)) return prev;
                return [...prev, { ...payload.new, votes: 0, comments: 0 } as Idea];
              });
            } else if (payload.eventType === "DELETE") {
              setIdeas((prev) => prev.filter((i) => i.id !== payload.old.id));
            } else if (payload.eventType === "UPDATE") {
              setIdeas((prev) => prev.map((i) => i.id === payload.new.id ? { ...i, ...payload.new } : i));
            }
          }
        )
        .subscribe();
    }

    load();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        db.removeChannel(channel);
      }
    };
  }, [sessionId, isLoaded, user]);

  async function handleJoinSession() {
    if (!user || !sessionId) return;
    setJoining(true);
    const db = getDb();
    
    const { error } = await db
      .from("session_members")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role: "contributor"
      });

    if (!error) {
      window.location.reload(); 
    } else {
      console.error("Failed to join session:", error);
      setJoining(false);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddIdea() {
    if (!newTitle.trim() || !user || !sessionId) return;
    setSaving(true);
    setSaveError(null);

    const db = getDb();
    const color = COLORS[ideas.length % COLORS.length];

    const { data, error } = await db
      .from("ideas")
      .insert({
        session_id:      sessionId,
        author_id:       user.id,
        title:           newTitle.trim(),
        description:     newDesc.trim() || null,
        color,
        is_ai_generated: false,
        status:          "open",
      })
      .select()
      .single();

    if (error || !data) {
      setSaveError(error?.message ?? "Failed to add idea.");
      setSaving(false);
      return;
    }

    setIdeas((prev) => {
      if (prev.find(i => i.id === data.id)) return prev;
      return [...prev, { ...data, votes: 0, comments: 0 }];
    });
    setNewTitle("");
    setNewDesc("");
    setSaving(false);
    setShowModal(false);
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm">{sessionTitle}</h2>
            {isMember && (
              <span className="text-mono text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Share className="w-3 h-3" />} 
              {copied ? "Copied Link" : "Share"}
            </button>
            <button className="text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
              <Download className="w-3 h-3" /> Export
            </button>
            {isMember && (
              <button
                onClick={() => setAiOpen(!aiOpen)}
                className={"text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition-colors " + (aiOpen ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}
              >
                <Sparkles className="w-3 h-3" /> AI
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading workspace...</span>
            </div>
          )}

          {/* Not a member -> Join Screen */}
          {!loading && !isMember && (
            <div className="flex-1 flex flex-col items-center justify-center p-5 dot-grid">
              <div className="surface-raised p-8 max-w-sm w-full text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Join Session</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  You've been invited to collaborate on "{sessionTitle}". Join to add ideas and view the workspace.
                </p>
                <button 
                  onClick={handleJoinSession}
                  disabled={joining}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : "Join Session"}
                </button>
              </div>
            </div>
          )}

          {/* Canvas (if member) */}
          {!loading && isMember && (
            <div className="flex-1 p-5 overflow-auto dot-grid">
              <div className="flex items-center justify-between mb-5">
                <span className="text-mono text-[10px] text-muted-foreground uppercase tracking-widest">Live Ideas</span>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
                >
                  <Plus className="w-3 h-3" /> Add Idea
                </button>
              </div>

              {/* Empty state */}
              {ideas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Lightbulb className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-1">No ideas yet</p>
                  <p className="text-xs text-muted-foreground mb-5">Click "Add Idea" to capture your first idea</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Plus className="w-3 h-3" /> Add Idea
                  </button>
                </div>
              )}

              {/* Idea cards */}
              {ideas.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {ideas.map((idea, i) => (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link to={"/session/" + sessionId + "/ideas/" + idea.id}>
                        <div className={idea.color + " idea-card cursor-pointer"}>
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-xs leading-snug">{idea.title}</h4>
                            <GripVertical className="w-3.5 h-3.5 opacity-25 shrink-0" />
                          </div>
                          {idea.description && (
                            <p className="text-[10px] opacity-65 mb-2.5 leading-relaxed">{idea.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] opacity-50">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" /> {idea.votes}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" /> {idea.comments}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Panel */}
          {aiOpen && isMember && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border flex flex-col shrink-0 bg-card/40"
            >
              <div className="p-3 border-b border-border flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-xs">AI Assistant</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
              </div>
              <div className="flex-1 p-3 overflow-auto space-y-2 text-[11px] text-muted-foreground">
                <p>Chat interface placeholder.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Idea Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">New Idea</h3>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. AI-powered onboarding"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleAddIdea(); }}
                    className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the idea..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground resize-none"
                  />
                </div>

                {saveError && (
                  <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                    {saveError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddIdea}
                    disabled={saving || !newTitle.trim()}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Plus className="w-3.5 h-3.5" /> Add Idea</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

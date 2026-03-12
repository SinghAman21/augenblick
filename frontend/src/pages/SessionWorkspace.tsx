import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/app/AppLayout";
import { getSupabaseClient } from "@/lib/supabase";
import { Share, Download, Plus, ThumbsUp, MessageCircle, Sparkles, Lightbulb, Expand, Link2, FileText, Loader2, X, Check, Users as UsersIcon, Search, Flag, ChevronDown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, type SessionMember, type SessionVoter } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { askGrok } from "@/api/ai";

const COLORS = ["idea-warm", "idea-teal", "idea-rose", "idea-sand", "idea-mint", "idea-coral"];

const CATEGORIES = ["All", "Product", "Marketing", "Technical", "Design", "Top Voted"] as const;

interface Idea {
  id: string;
  title: string;
  description: string | null;
  color: string;
  author_id: string;
  author_name?: string | null;
  created_at: string;
  votes: number;
  comments: number;
  category?: string;
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
  const [newCategory, setNewCategory] = useState("product");
  const [newTags, setNewTags]       = useState("");
  const [newEmoji, setNewEmoji]     = useState("💡");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  const IDEA_EMOJIS = ["💡", "🔥", "🚀", "⭐", "👍", "💬", "🎯", "✨", "🧠", "📌", "🌈", "⚡"];
  const MODAL_CATEGORIES = ["Product", "Marketing", "Technical", "Design"];

  // Session meta
  const [sessionTitle, setSessionTitle] = useState("Loading...");
  const [sessionDescription, setSessionDescription] = useState<string | null>(null);
  const [sessionIsPrivate, setSessionIsPrivate] = useState(false);
  const [collaboratorCount, setCollaboratorCount] = useState(0);

  // Workspace UI
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [aiTab, setAiTab] = useState<"generate" | "summary" | "elaboration">("generate");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerateResult, setAiGenerateResult] = useState<string | null>(null);
  const [aiSummaryResult, setAiSummaryResult] = useState<string | null>(null);
  const [aiElaborationResult, setAiElaborationResult] = useState<string | null>(null);

  // Share link state
  const [copied, setCopied] = useState(false);

  // Collaborators modal
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [collaborators, setCollaborators] = useState<SessionMember[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  // Voted modal (people who voted)
  const [showVotedModal, setShowVotedModal] = useState(false);
  const [voters, setVoters] = useState<SessionVoter[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  // Invite modal (list of people + invite link)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMembers, setInviteMembers] = useState<SessionMember[]>([]);
  const [loadingInviteMembers, setLoadingInviteMembers] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  function getDb() {
    return getSupabaseClient();
  }

  // Load session details + membership + ideas + Realtime WebSockets
  useEffect(() => {
    if (!sessionId || !isLoaded || !user) return;
    const db = getDb();
    let channel: ReturnType<typeof db.channel> | null = null;

    async function load() {
      try {
        // 1. Session details
        const { data: sess } = await db
          .from("sessions")
          .select("title, description, is_private")
          .eq("id", sessionId)
          .single();
        if (sess) {
          setSessionTitle(sess.title);
          setSessionDescription(sess.description ?? null);
          setSessionIsPrivate(!!sess.is_private);
        }

        // 2. Check if user is a member
        const { data: membership } = await db
          .from("session_members")
          .select("role")
          .eq("session_id", sessionId)
          .eq("user_id", user!.id)
          .maybeSingle();

        if (!membership) {
          setIsMember(false);
          return; // Don't try to fetch ideas or subscribe yet
        }

        setIsMember(true);

        // 2b. Collaborator count for this session
        const { count: memberCount } = await db
          .from("session_members")
          .select("*", { count: "exact", head: true })
          .eq("session_id", sessionId);
        setCollaboratorCount(memberCount ?? 0);

        // 3. Fetch Initial Ideas
        const { data: rawIdeas } = await db
          .from("ideas")
          .select("id, title, description, color, author_id, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (rawIdeas) {
          // Get vote + comment counts and author name in parallel
          const enriched = await Promise.all(
            rawIdeas.map(async (idea: { id: string; title: string; description: string | null; color: string; author_id: string; created_at: string }) => {
              const [{ count: votes }, { count: comments }, { data: profile }] = await Promise.all([
                db.from("idea_votes").select("*", { count: "exact", head: true }).eq("idea_id", idea.id),
                db.from("idea_comments").select("*", { count: "exact", head: true }).eq("idea_id", idea.id).eq("is_deleted", false),
                db.from("profiles").select("display_name").eq("id", idea.author_id).maybeSingle(),
              ]);
              return { ...idea, author_name: profile?.display_name ?? null, votes: votes ?? 0, comments: comments ?? 0 };
            })
          );
          setIdeas(enriched);
        }

        // 4. Set up Realtime Subscription (WebSockets)
        channel = db.channel("ideas_" + sessionId)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "ideas", filter: "session_id=eq." + sessionId },
            async (payload) => {
              if (payload.eventType === "INSERT") {
                const newIdea = payload.new as { id: string; author_id?: string; [k: string]: unknown };
                let authorName: string | null = null;
                if (newIdea.author_id) {
                  const { data: profile } = await db.from("profiles").select("display_name").eq("id", newIdea.author_id).maybeSingle();
                  authorName = profile?.display_name ?? null;
                }
                setIdeas((prev) => {
                  if (prev.find(i => i.id === newIdea.id)) return prev;
                  return [...prev, { ...newIdea, author_name: authorName, votes: 0, comments: 0 } as Idea];
                });
              } else if (payload.eventType === "DELETE") {
                setIdeas((prev) => prev.filter((i) => i.id !== payload.old.id));
              } else if (payload.eventType === "UPDATE") {
                setIdeas((prev) => prev.map((i) => i.id === payload.new.id ? { ...i, ...payload.new } : i));
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Session load error:", err);
        toast.error("Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    load();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        db.removeChannel(channel);
      }
    };
  }, [sessionId, isLoaded, user]);

  // Refetch idea vote/comment counts when user returns to this tab (e.g. from idea detail)
  useEffect(() => {
    if (!sessionId || !isMember || !user) return;
    const db = getDb();
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      const { data: rawIdeas } = await db
        .from("ideas")
        .select("id, title, description, color, author_id, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (!rawIdeas?.length) return;
      const enriched = await Promise.all(
        rawIdeas.map(async (idea: { id: string; title: string; description: string | null; color: string; author_id: string; created_at: string }) => {
          const [{ count: votes }, { count: comments }, { data: profile }] = await Promise.all([
            db.from("idea_votes").select("*", { count: "exact", head: true }).eq("idea_id", idea.id),
            db.from("idea_comments").select("*", { count: "exact", head: true }).eq("idea_id", idea.id).eq("is_deleted", false),
            db.from("profiles").select("display_name").eq("id", idea.author_id).maybeSingle(),
          ]);
          return { ...idea, author_name: profile?.display_name ?? null, votes: votes ?? 0, comments: comments ?? 0 };
        })
      );
      setIdeas(enriched);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sessionId, isMember, user]);

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

  async function handleAIGenerate() {
    const prompt = aiPrompt.trim() || "Generate starter ideas for a brainstorming session.";
    setAiLoading(true);
    setAiGenerateResult(null);
    try {
      const { text } = await askGrok({ action: "generate", prompt });
      setAiGenerateResult(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAISummary() {
    setAiLoading(true);
    setAiSummaryResult(null);
    try {
      const ideasList = ideas.map((i) => i.title).filter(Boolean);
      const { text } = await askGrok({ action: "summarize", ideas: ideasList });
      setAiSummaryResult(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAIElaborate(ideaTitle?: string) {
    const prompt = ideaTitle?.trim() || topIdeas[0]?.title || "Expand this idea";
    setAiLoading(true);
    setAiElaborationResult(null);
    try {
      const { text } = await askGrok({ action: "expand", prompt });
      setAiElaborationResult(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  const totalVotes = useMemo(() => ideas.reduce((s, i) => s + i.votes, 0), [ideas]);

  const filteredAndSortedIdeas = useMemo(() => {
    let list = [...ideas];
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((i) => i.title.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q));
    if (filterCategory !== "All" && filterCategory !== "Top Voted") {
      list = list.filter((i) => (i.category ?? "product").toLowerCase() === filterCategory.toLowerCase());
    }
    if (filterCategory === "Top Voted") list.sort((a, b) => b.votes - a.votes);
    return list;
  }, [ideas, searchQuery, filterCategory]);

  const topIdeas = useMemo(() => [...ideas].sort((a, b) => b.votes - a.votes).slice(0, 3), [ideas]);

  const liveActivity = useMemo(
    () => ideas.slice(-5).reverse().map((i) => ({ id: i.id, text: `${i.author_name || "Someone"} added "${i.title}"` })),
    [ideas]
  );

  useEffect(() => {
    if (!showCollaboratorsModal || !sessionId) return;
    setLoadingCollaborators(true);
    api.sessions
      .getMembers(sessionId)
      .then((res) => setCollaborators(res.members))
      .catch(() => toast.error("Failed to load collaborators"))
      .finally(() => setLoadingCollaborators(false));
  }, [showCollaboratorsModal, sessionId]);

  useEffect(() => {
    if (!showVotedModal || !sessionId) return;
    setLoadingVoters(true);
    api.sessions
      .getVoters(sessionId)
      .then((res) => setVoters(res.voters))
      .catch(() => toast.error("Failed to load voters"))
      .finally(() => setLoadingVoters(false));
  }, [showVotedModal, sessionId]);

  useEffect(() => {
    if (!showInviteModal || !sessionId) return;
    setLoadingInviteMembers(true);
    api.sessions
      .getMembers(sessionId)
      .then((res) => setInviteMembers(res.members))
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoadingInviteMembers(false));
  }, [showInviteModal, sessionId]);

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

    const authorName = user.fullName ?? user.firstName ?? user.primaryEmailAddress?.emailAddress ?? "You";
    setIdeas((prev) => {
      if (prev.find(i => i.id === data.id)) return prev;
      return [...prev, { ...data, author_name: authorName, votes: 0, comments: 0 }];
    });
    setNewTitle("");
    setNewDesc("");
    setNewCategory("product");
    setNewTags("");
    setNewEmoji("💡");
    setSaving(false);
    setShowModal(false);
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">

        {/* When member: row with left (header + metrics + content) and right (AI sidebar full height) */}
        {!loading && isMember ? (
          <div className="flex flex-1 min-h-0">
            {/* Left column: header, metrics, main content */}
            <div className="flex flex-col flex-1 min-h-0 min-w-0">
              {/* Header: breadcrumb + project selector + actions */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-card/30">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[11px] text-muted-foreground text-mono uppercase tracking-wider">Workspace Dashboard</p>
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-display text-base truncate">{sessionTitle}</h2>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  {sessionDescription && (
                    <p className="text-xs text-muted-foreground truncate max-w-md">{sessionDescription}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80 transition-all text-xs font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Share"}
                  </button>
                  {/* <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80 transition-all text-xs font-medium">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button> */}
                  {isMember && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg"
                    >
                      <Plus className="w-4 h-4" /> New Idea
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics row + Invite only (no duplicate New Idea, no green banner) */}
              <div className="px-5 py-4 border-b border-border/60 bg-background/50 shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 min-w-0">
                    <div className="surface-raised p-3 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-display">{ideas.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ideas</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVotedModal(true)}
                      className="surface-raised p-3 rounded-lg flex items-center gap-2 w-full text-left hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <ThumbsUp className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-display">{totalVotes}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Voted</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCollaboratorsModal(true)}
                      className="surface-raised p-3 rounded-lg flex items-center gap-2 w-full text-left hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-display">{collaboratorCount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Collaborators</p>
                      </div>
                    </button>
                    <div className="surface-raised p-3 rounded-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-display">{sessionIsPrivate ? "Private" : "Public"}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Session</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                  >
                    Invite
                  </button>
                </div>
              </div>

              {/* Scrollable main content: search, filters, idea grid */}
              <div className="flex-1 p-6 overflow-auto dot-grid min-h-0">
                {/* Search + filter tabs */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search Ideas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-card border-border text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          filterCategory === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Empty state */}
                {ideas.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-5 ring-1 ring-primary/20">
                      <Lightbulb className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-base font-semibold mb-1.5">No ideas yet</p>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      Add your first idea or use AI to generate suggestions.
                    </p>
                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                      <Plus className="w-4 h-4" /> Add your first idea
                    </button>
                  </div>
                )}

                {/* Idea cards + Add New Idea card */}
                {ideas.length > 0 && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredAndSortedIdeas.map((idea) => (
                      <motion.div
                        key={idea.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link to={"/session/" + sessionId + "/ideas/" + idea.id} className="block h-full">
                          <div className={`${idea.color} idea-card cursor-pointer h-full flex flex-col group`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-sm leading-snug flex-1 min-w-0">{idea.title}</h4>
                              <Flag className="w-3.5 h-3.5 opacity-40 shrink-0 mt-0.5" />
                            </div>
                            {idea.description && (
                              <p className="text-xs opacity-90 mb-3 leading-relaxed line-clamp-2 flex-1">{idea.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-black/10 font-medium capitalize">
                                {idea.category ?? "Product"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs opacity-80 mt-auto">
                              <span className="flex items-center gap-1.5">
                                <ThumbsUp className="w-3 h-3" /> {idea.votes}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MessageCircle className="w-3 h-3" /> {idea.comments}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-full min-h-[140px]"
                    >
                      <button
                        onClick={() => setShowModal(true)}
                        className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground hover:text-primary"
                      >
                        <Plus className="w-8 h-8" />
                        <span className="text-xs font-medium">Add New Idea or use AI to generate.</span>
                      </button>
                    </motion.div>
                  </div>
                )}
              </div>

            </div>

            {/* Right sidebar: AI Assistant (full height from top) */}
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                className="border-l border-border flex flex-col shrink-0 bg-card/40 w-80 overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Assistant
                  </h3>
                </div>
                <Tabs value={aiTab} onValueChange={(v) => setAiTab(v as "generate" | "summary" | "elaboration")} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-9">
                    <TabsTrigger value="generate" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Generate</TabsTrigger>
                    <TabsTrigger value="summary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Summary</TabsTrigger>
                    <TabsTrigger value="elaboration" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Elaboration</TabsTrigger>
                  </TabsList>
                  <TabsContent value="generate" className="flex-1 p-3 space-y-3 mt-0 overflow-auto">
                    <Input
                      placeholder="Describe ideas you want to generate..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="bg-muted/30 border-border text-sm resize-none"
                      disabled={aiLoading}
                    />
                    <button
                      type="button"
                      className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2"
                      onClick={handleAIGenerate}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : "Generate"}
                    </button>
                    {aiGenerateResult && (
                      <div className="p-2 rounded-lg bg-muted/50 border border-border text-xs whitespace-pre-line">
                        {aiGenerateResult}
                      </div>
                    )}
                    <div className="space-y-2">
                      {topIdeas.slice(0, 2).map((i) => (
                        <div key={i.id} className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="text-xs flex-1 truncate">{i.title}</span>
                          <Link to={"/session/" + sessionId + "/ideas/" + i.id} className="text-primary shrink-0">→</Link>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="summary" className="flex-1 p-3 mt-0 overflow-auto space-y-3 text-xs text-muted-foreground">
                    <button
                      type="button"
                      className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2"
                      onClick={handleAISummary}
                      disabled={aiLoading || ideas.length === 0}
                    >
                      {aiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Summarizing…</> : "Summarize session"}
                    </button>
                    {ideas.length === 0 && <p>Add ideas first, then run summary.</p>}
                    {aiSummaryResult && (
                      <div className="p-2 rounded-lg bg-muted/50 border border-border text-foreground whitespace-pre-line">
                        {aiSummaryResult}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="elaboration" className="flex-1 p-3 mt-0 overflow-auto space-y-3 text-xs text-muted-foreground">
                    <p>Pick an idea to expand with AI.</p>
                    {topIdeas.slice(0, 3).map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border hover:border-primary/30 text-left"
                        onClick={() => handleAIElaborate(i.title)}
                        disabled={aiLoading}
                      >
                        <span className="truncate">{i.title}</span>
                        <span className="text-primary shrink-0">Expand</span>
                      </button>
                    ))}
                    {aiElaborationResult && (
                      <div className="p-2 rounded-lg bg-muted/50 border border-border text-foreground whitespace-pre-line">
                        {aiElaborationResult}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                <div className="p-3 border-t border-border">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Ideas</h4>
                  <ul className="space-y-2">
                    {topIdeas.map((i, idx) => (
                      <li key={i.id} className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{idx + 1}</span>
                        <Link to={"/session/" + sessionId + "/ideas/" + i.id} className="flex-1 truncate hover:text-primary">{i.title}</Link>
                        <span className="text-[10px] text-muted-foreground">({i.votes})</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 border-t border-border">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live Activity</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {liveActivity.slice(0, 5).map((a) => (
                      <li key={a.id} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        {a.text}
                      </li>
                    ))}
                    {liveActivity.length === 0 && <li>No recent activity.</li>}
                  </ul>
                </div>
              </motion.div>
          </div>
        ) : (
          <>
            {loading && (
              <div className="flex-1 flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading workspace...</span>
              </div>
            )}
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
          </>
        )}
      </div>

      {/* Collaborators modal */}
      <Dialog open={showCollaboratorsModal} onOpenChange={setShowCollaboratorsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collaborators</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {loadingCollaborators ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No collaborators yet.</p>
            ) : (
              <ul className="space-y-3">
                {collaborators.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <UsersIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {m.display_name?.trim() || m.email || "Anonymous"}
                      </p>
                      {m.email && m.display_name?.trim() && (
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase shrink-0">{m.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Voted modal – people who voted */}
      <Dialog open={showVotedModal} onOpenChange={setShowVotedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>People who voted</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {loadingVoters ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : voters.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No votes yet.</p>
            ) : (
              <ul className="space-y-3">
                {voters.map((v) => (
                  <li key={v.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <ThumbsUp className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {v.display_name?.trim() || v.email || "Anonymous"}
                      </p>
                      {v.email && v.display_name?.trim() && (
                        <p className="text-xs text-muted-foreground truncate">{v.email}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ↑{v.votes_up} ↓{v.votes_down}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite modal – list of people + invite link */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Session members</p>
              {loadingInviteMembers ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : inviteMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No members yet.</p>
              ) : (
                <ul className="space-y-2">
                  {inviteMembers.map((m) => (
                    <li key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <UsersIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {m.display_name?.trim() || m.email || "Anonymous"}
                        </p>
                        {m.email && m.display_name?.trim() && (
                          <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase shrink-0">{m.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Invite link</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="flex-1 bg-muted/30 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                      setInviteLinkCopied(true);
                      toast.success("Link copied");
                      setTimeout(() => setInviteLinkCopied(false), 2000);
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1"
                >
                  {inviteLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Idea Modal – template style */}
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
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-display text-lg">New Idea</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {IDEA_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewEmoji(emoji)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      newEmoji === emoji ? "bg-primary/20 border-2 border-primary" : "bg-muted/50 border border-border hover:bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-mono uppercase tracking-wider text-muted-foreground mb-1 block">Title <span className="text-red-500">*</span></label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Smart Notification Engine"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleAddIdea(); }}
                    className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-mono uppercase tracking-wider text-muted-foreground">Description</label>
                    <button type="button" className="text-[10px] text-primary hover:underline">AI Expand</button>
                  </div>
                  <textarea
                    placeholder="Brief description of the idea..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-mono uppercase tracking-wider text-muted-foreground mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {MODAL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewCategory(cat.toLowerCase())}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          newCategory === cat.toLowerCase() ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-mono uppercase tracking-wider text-muted-foreground mb-1 block">Tags</label>
                  <input
                    type="text"
                    placeholder="e.g. Notifications, AI, Personalization"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                {saveError && (
                  <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{saveError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
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

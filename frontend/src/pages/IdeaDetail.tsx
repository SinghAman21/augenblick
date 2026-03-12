import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/app/AppLayout";
import { ThumbsUp, ThumbsDown, Tag, ArrowLeft, Send, Lightbulb } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api, type IdeaWithVotes, type IdeaComment } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

const variations = [
  "Smart questionnaire on first launch",
  "Adaptive tutorial based on skill level",
];

const aiSuggestions = [
  "Try a freemium onboarding to learn adoption patterns.",
  "Very progressive dialogues for complex features/onboarding.",
  "Adaptive and personalized success stories during onboarding.",
];

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function IdeaDetail() {
  const { sessionId, ideaId } = useParams();
  const { user } = useUser();
  const [idea, setIdea] = useState<IdeaWithVotes | null>(null);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discuss");
  const [newComment, setNewComment] = useState("");
  const [newVariation, setNewVariation] = useState("");
  const [votingIdea, setVotingIdea] = useState<"up" | "down" | null>(null);
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  const loadIdea = () => {
    if (!ideaId) return;
    api.ideas.getById(ideaId).then((res) => setIdea(res.idea)).catch(() => toast.error("Failed to load idea"));
  };

  const loadComments = () => {
    if (!ideaId) return Promise.resolve();
    return api.ideas.getComments(ideaId).then((res) => setComments(res.comments)).catch(() => toast.error("Failed to load comments"));
  };

  useEffect(() => {
    if (!ideaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([api.ideas.getById(ideaId), api.ideas.getComments(ideaId)])
      .then(([ideaRes, commentsRes]) => {
        setIdea(ideaRes.idea);
        setComments(commentsRes.comments);
      })
      .catch(() => toast.error("Failed to load idea"))
      .finally(() => setLoading(false));
  }, [ideaId]);

  const handleIdeaVote = async (value: 1 | -1) => {
    if (!ideaId || !user?.id) {
      toast.error("Sign in to vote");
      return;
    }
    setVotingIdea(value === 1 ? "up" : "down");
    try {
      await api.ideas.vote(ideaId, { user_id: user.id, value });
      loadIdea();
    } catch {
      toast.error("Failed to vote");
    } finally {
      setVotingIdea(null);
    }
  };

  const handleCommentVote = async (commentId: string, value: 1 | -1) => {
    if (!ideaId || !user?.id) {
      toast.error("Sign in to vote");
      return;
    }
    setVotingCommentId(commentId);
    try {
      await api.ideas.commentVote(ideaId, commentId, { user_id: user.id, value });
      await loadComments();
    } catch {
      toast.error("Failed to vote on comment");
    } finally {
      setVotingCommentId(null);
    }
  };

  const handlePostComment = async () => {
    if (!ideaId || !user?.id || !newComment.trim()) return;
    setPostingComment(true);
    try {
      await api.ideas.postComment(ideaId, { body: newComment.trim(), author_id: user.id });
      setNewComment("");
      loadComments();
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading || !idea) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[40vh]">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading...
            </div>
          ) : (
            <p className="text-muted-foreground">Idea not found.</p>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/session/${sessionId}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors text-mono"
          >
            <ArrowLeft className="w-3 h-3" /> back to session
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-display text-2xl">{idea.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {idea.description || "No description."}
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full inline-flex rounded-lg bg-muted/50 p-1 border border-border">
                <TabsTrigger value="discuss" className="flex-1 rounded-md">Discuss</TabsTrigger>
                <TabsTrigger value="variations" className="flex-1 rounded-md">Variations</TabsTrigger>
                <TabsTrigger value="ai-expand" className="flex-1 rounded-md">AI Expand</TabsTrigger>
              </TabsList>

              <TabsContent value="discuss" className="mt-6 space-y-4">
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="surface-raised p-4 rounded-lg">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium">{c.author_name}</span>
                        <span className="text-mono text-[10px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{c.body}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCommentVote(c.id, 1)}
                          disabled={votingCommentId === c.id}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          {votingCommentId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />} {c.votes_up}
                        </button>
                        <button
                          onClick={() => handleCommentVote(c.id, -1)}
                          disabled={votingCommentId === c.id}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <ThumbsDown className="w-3 h-3" /> {c.votes_down}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostComment()}
                    className="flex-1 bg-card border-border"
                    disabled={!user?.id}
                  />
                  <Button size="sm" className="btn-primary shrink-0" onClick={handlePostComment} disabled={postingComment || !newComment.trim() || !user?.id}>
                    {postingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />} Post
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="variations" className="mt-6 space-y-4">
                <div className="space-y-3">
                  {variations.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 surface-raised p-3 rounded-lg">
                      <Checkbox id={`var-${i}`} />
                      <label htmlFor={`var-${i}`} className="text-sm flex-1 cursor-pointer">{v}</label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe a variation..."
                    value={newVariation}
                    onChange={(e) => setNewVariation(e.target.value)}
                    className="flex-1 bg-card border-border"
                  />
                  <Button size="sm" variant="outline" className="shrink-0">Add</Button>
                </div>
              </TabsContent>

              <TabsContent value="ai-expand" className="mt-6 space-y-4">
                <div className="space-y-3">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 surface-raised p-3 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-sm flex-1">{s}</p>
                      <Button size="sm" variant="outline" className="shrink-0">Add</Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm">Regenerate</Button>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:w-56 shrink-0 space-y-6">
            <div className="flex flex-wrap gap-1.5">
              <span className="tag-primary flex items-center gap-1 text-xs">
                <Tag className="w-2.5 h-2.5" /> Product
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleIdeaVote(1)}
                disabled={votingIdea !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-sm disabled:opacity-50"
              >
                {votingIdea === "up" ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <ThumbsUp className="w-3.5 h-3.5 text-primary" />}
                <span className="font-medium">{idea.votes_up}</span>
              </button>
              <button
                onClick={() => handleIdeaVote(-1)}
                disabled={votingIdea !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md surface-inset text-sm disabled:opacity-50"
              >
                {votingIdea === "down" ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="font-medium">{idea.votes_down}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

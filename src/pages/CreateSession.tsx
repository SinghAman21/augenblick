import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { createClient } from "@supabase/supabase-js";
import { AppLayout } from "@/components/app/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Loader2 } from "lucide-react";

export default function CreateSession() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("product");
  const [isPrivate, setIsPrivate]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) { setError("Session name is required."); return; }
    if (!user)          { setError("You must be signed in."); return; }

    setLoading(true);
    setError(null);

    const db = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_API_KEY,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    // 1. Insert the session
    const { data: session, error: sessionErr } = await db
      .from("sessions")
      .insert({
        owner_id:    user.id,
        title:       title.trim(),
        description: description.trim() || null,
        category,
        is_private:  isPrivate,
        status:      "active",
      })
      .select()
      .single();

    if (sessionErr || !session) {
      console.error("Session insert failed:", sessionErr);
      setError(sessionErr?.message ?? "Failed to create session.");
      setLoading(false);
      return;
    }

    // 2. Add creator as owner in session_members
    const { error: memberErr } = await db.from("session_members").insert({
      session_id: session.id,
      user_id:    user.id,
      role:       "owner",
    });

    if (memberErr) {
      console.error("Member insert failed:", memberErr);
    }

    setLoading(false);
    navigate("/session/" + session.id);
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-xl">
        <h1 className="text-display text-2xl mb-1">Create Session</h1>
        <p className="text-sm text-muted-foreground mb-8">Set up a new brainstorming session.</p>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-mono uppercase tracking-wider text-muted-foreground">
              Session Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Q2 Product Roadmap"
              className="bg-card border-border"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-mono uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              placeholder="What will you brainstorm about?"
              className="bg-card border-border min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-mono uppercase tracking-wider text-muted-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between surface-raised p-4">
            <div>
              <p className="text-sm font-medium">Private Session</p>
              <p className="text-[11px] text-muted-foreground">Only invited members can join</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="btn-primary flex items-center gap-2 w-full justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <>Create Session <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

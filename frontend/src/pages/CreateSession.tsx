import { FormEvent, useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";

export default function CreateSession() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("product");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Session name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const { session } = await api.sessions.create({
        title: title.trim(),
        description: description.trim() || null,
        category,
        is_private: isPrivate,
      });

      toast.success("Session created");
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-xl">
        <h1 className="text-display text-2xl mb-1">Create Session</h1>
        <p className="text-sm text-muted-foreground mb-8">Set up a new brainstorming session.</p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label className="text-xs text-mono uppercase tracking-wider text-muted-foreground">Session Name</Label>
            <Input
              placeholder="e.g. Q2 Product Roadmap"
              className="bg-card border-border"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-mono uppercase tracking-wider text-muted-foreground">Description</Label>
            <Textarea
              placeholder="What will you brainstorm about?"
              className="bg-card border-border min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-mono uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
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
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2 w-full justify-center mt-2 disabled:opacity-60">
            {isSubmitting ? "Creating..." : "Create Session"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}

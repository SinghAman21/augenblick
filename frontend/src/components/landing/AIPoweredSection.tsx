import { motion } from "framer-motion";
import { Sparkles, Lightbulb, Expand, Link2, FileText, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { askGrok, type AIAction } from "@/api/ai";

const capabilities: { icon: typeof Lightbulb; label: string; action: AIAction }[] = [
  { icon: Lightbulb, label: "Generate from prompts", action: "generate" },
  { icon: Expand, label: "Expand any idea", action: "expand" },
  { icon: Link2, label: "Find connections", action: "related" },
  { icon: FileText, label: "Summarize sessions", action: "summarize" },
];

type Message = { role: "user" | "ai"; text: string };

export function AIPoweredSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (promptText: string, action: AIAction = "chat") => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const { text } = await askGrok({ action, prompt: trimmed });
      setMessages((prev) => [...prev, { role: "ai", text }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI request failed";
      setError(msg);
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input, "chat");
  };

  return (
    <section id="ai" className="py-24 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-mono text-xs text-primary mb-3 uppercase tracking-widest">AI</p>
          <h2 className="text-display text-3xl sm:text-4xl max-w-lg">
            An AI that thinks alongside you
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md">
            Not a chatbot — a brainstorming partner that generates, expands, and connects ideas.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Chat — 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 surface-raised p-5"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">AI Assistant</span>
              <span className={`ml-auto w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-secondary"}`} />
              <span className="text-mono text-[10px] text-muted-foreground">{loading ? "thinking…" : "online"}</span>
            </div>

            <div className="space-y-3 min-h-[200px] max-h-[320px] overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground py-4">Ask for ideas, expand a concept, or get a session summary.</p>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-xs whitespace-pre-line leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary/15 text-foreground border border-primary/20"
                      : "bg-muted/60 text-foreground border border-border/50"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 surface-inset px-3 py-2">
              <input
                type="text"
                placeholder="Ask AI to brainstorm..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="shrink-0 text-primary hover:opacity-80 disabled:opacity-50">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </motion.div>

          {/* Capabilities — 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-3"
          >
            {capabilities.map((cap, i) => (
              <motion.button
                key={cap.label}
                type="button"
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="w-full surface-raised p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left disabled:opacity-60"
                onClick={() => {
                  const prompts: Record<AIAction, string> = {
                    generate: "Generate 5 creative ideas for improving team collaboration",
                    expand: "Expand on the idea: AI-powered meeting summaries",
                    related: "Suggest related ideas for: remote work productivity",
                    summarize: "Summarize key themes and next steps",
                    chat: "How can we brainstorm better?",
                  };
                  send(prompts[cap.action] || prompts.chat, cap.action);
                }}
                disabled={loading}
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <cap.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{cap.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

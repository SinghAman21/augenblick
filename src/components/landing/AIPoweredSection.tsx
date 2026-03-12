import { motion } from "framer-motion";
import { Sparkles, Lightbulb, Expand, Link2, FileText, Send } from "lucide-react";
import { useState, useEffect } from "react";

const aiMessages = [
  { role: "user" as const, text: "Give me 5 ideas for improving remote team culture" },
  { role: "ai" as const, text: "1. Virtual coffee roulette\n2. Async show-and-tell channel\n3. Monthly \"demo day\" for side projects\n4. Team rituals bot\n5. Peer recognition board" },
  { role: "user" as const, text: "Expand on #4 — Team rituals bot" },
  { role: "ai" as const, text: "A Slack/Teams bot that prompts daily check-ins, weekly wins, and monthly retrospectives. Configurable cadence, auto-summarizes responses, tracks sentiment over time." },
];

const capabilities = [
  { icon: Lightbulb, label: "Generate from prompts" },
  { icon: Expand, label: "Expand any idea" },
  { icon: Link2, label: "Find connections" },
  { icon: FileText, label: "Summarize sessions" },
];

export function AIPoweredSection() {
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages((v) => (v < aiMessages.length ? v + 1 : v));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

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
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="text-mono text-[10px] text-muted-foreground">online</span>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {aiMessages.slice(0, visibleMessages).map((msg, i) => (
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
            </div>

            <div className="mt-4 flex items-center gap-2 surface-inset px-3 py-2">
              <input
                type="text"
                placeholder="Ask AI to brainstorm..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                readOnly
              />
              <Send className="w-3.5 h-3.5 text-primary" />
            </div>
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
              <motion.div
                key={cap.label}
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="surface-raised p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <cap.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{cap.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

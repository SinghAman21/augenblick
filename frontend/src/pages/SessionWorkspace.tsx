import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/app/AppLayout";
import { Share, Download, Plus, ThumbsUp, MessageCircle, Sparkles, Send, Lightbulb, Expand, Link2, FileText, GripVertical } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const sampleIdeas = [
  { id: "1", title: "AI-powered onboarding wizard", desc: "Guide users through setup with intelligent suggestions", votes: 12, comments: 5, color: "idea-warm" },
  { id: "2", title: "Collaborative whiteboard mode", desc: "Free-form drawing and idea mapping", votes: 8, comments: 3, color: "idea-teal" },
  { id: "3", title: "Voice-to-idea transcription", desc: "Speak your ideas and have them transcribed", votes: 15, comments: 7, color: "idea-rose" },
  { id: "4", title: "Idea templates library", desc: "Pre-built templates for common formats", votes: 6, comments: 2, color: "idea-sand" },
  { id: "5", title: "Smart idea deduplication", desc: "AI detects and merges similar ideas", votes: 10, comments: 4, color: "idea-mint" },
  { id: "6", title: "Slack/Teams integration", desc: "Push ideas and summaries to chat tools", votes: 9, comments: 3, color: "idea-coral" },
];

const aiTools = [
  { icon: Lightbulb, label: "Generate" },
  { icon: Expand, label: "Expand" },
  { icon: FileText, label: "Summarize" },
  { icon: Link2, label: "Related" },
];

export default function SessionWorkspace() {
  const { sessionId } = useParams();
  const [aiOpen, setAiOpen] = useState(true);
  const [aiMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Ready to brainstorm. Ask me to generate ideas or expand on existing ones." },
  ]);

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm">Q2 Product Roadmap</h2>
            <span className="text-mono text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">6 ideas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5 mr-2">
              {["38", "160", "280"].map((hue, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-background" style={{ background: `hsl(${hue} 50% 55%)` }} />
              ))}
            </div>
            <button className="text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
              <Share className="w-3 h-3" /> Share
            </button>
            <button className="text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className={`text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition-colors ${
                aiOpen ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Sparkles className="w-3 h-3" /> AI
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Canvas */}
          <div className="flex-1 p-5 overflow-auto dot-grid">
            <div className="flex items-center justify-between mb-5">
              <span className="text-mono text-[10px] text-muted-foreground uppercase tracking-widest">Ideas</span>
              <button className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5">
                <Plus className="w-3 h-3" /> Add Idea
              </button>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {sampleIdeas.map((idea, i) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/session/${sessionId}/ideas/${idea.id}`}>
                    <div className={`${idea.color} idea-card cursor-pointer`}>
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-xs leading-snug">{idea.title}</h4>
                        <GripVertical className="w-3.5 h-3.5 opacity-25 shrink-0" />
                      </div>
                      <p className="text-[10px] opacity-65 mb-2.5 leading-relaxed">{idea.desc}</p>
                      <div className="flex items-center gap-3 text-[10px] opacity-50">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" /> {idea.votes}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" /> {idea.comments}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Panel */}
          {aiOpen && (
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

              <div className="p-2.5 grid grid-cols-2 gap-1.5 border-b border-border">
                {aiTools.map((tool) => (
                  <button key={tool.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <tool.icon className="w-3 h-3 text-primary" /> {tool.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-3 overflow-auto space-y-2">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] rounded-md px-3 py-2 text-[11px] ${
                      msg.role === "user" ? "bg-primary/15 border border-primary/20" : "bg-muted/40 border border-border/50"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 border-t border-border">
                <div className="flex items-center gap-2 surface-inset px-2.5 py-1.5">
                  <input type="text" placeholder="Ask AI..." className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground" />
                  <Send className="w-3 h-3 text-primary cursor-pointer" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

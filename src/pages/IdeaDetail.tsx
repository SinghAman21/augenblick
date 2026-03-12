import { motion } from "framer-motion";
import { AppLayout } from "@/components/app/AppLayout";
import { ThumbsUp, ThumbsDown, Tag, ArrowLeft, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const comments = [
  { author: "Alex", text: "This could integrate with our existing transcription service.", time: "2h ago" },
  { author: "Sara", text: "Love this! We should prototype it next sprint.", time: "1h ago" },
  { author: "Mike", text: "What about privacy concerns with voice recording?", time: "30m ago" },
];

export default function IdeaDetail() {
  const { sessionId } = useParams();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <Link
          to={`/session/${sessionId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors text-mono"
        >
          <ArrowLeft className="w-3 h-3" /> back to session
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-display text-2xl mb-2">Voice-to-idea transcription</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Speak your ideas and have them automatically transcribed into cards on the board.
            Real-time speech recognition captures ideas as they flow naturally.
          </p>

          <div className="flex items-center gap-2 mb-6">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-sm">
              <ThumbsUp className="w-3.5 h-3.5 text-primary" /> <span className="font-medium">15</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md surface-inset text-sm">
              <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground" /> <span className="font-medium">2</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-8">
            {["AI", "Voice", "Accessibility", "MVP"].map((tag) => (
              <span key={tag} className="tag-primary flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> {tag}
              </span>
            ))}
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">Discussion ({comments.length})</h3>
            <div className="space-y-3 mb-5">
              {comments.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="surface-raised p-3.5"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20" />
                    <span className="text-xs font-medium">{c.author}</span>
                    <span className="text-mono text-[10px] text-muted-foreground ml-auto">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-2 surface-raised px-3 py-2.5">
              <input type="text" placeholder="Add a comment..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
              <Send className="w-3.5 h-3.5 text-primary cursor-pointer" />
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

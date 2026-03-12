import { motion } from "framer-motion";
import { ThumbsUp, MessageCircle, Sparkles } from "lucide-react";

const notes = [
  { text: "AI-powered search", color: "idea-warm", x: 10, y: 10, delay: 0, rotate: -2 },
  { text: "Real-time sync", color: "idea-teal", x: 175, y: 50, delay: 0.15, rotate: 1.5 },
  { text: "Smart clusters", color: "idea-rose", x: 30, y: 140, delay: 0.3, rotate: -1 },
  { text: "Team voting", color: "idea-sand", x: 190, y: 190, delay: 0.45, rotate: 2.5 },
  { text: "Auto-organize", color: "idea-mint", x: 80, y: 280, delay: 0.6, rotate: -1.5 },
];

export function FloatingBoard() {
  return (
    <div className="relative w-full h-[460px]">
      <div className="absolute inset-0 surface-raised overflow-hidden dot-grid">
        {notes.map((note, i) => (
          <motion.div
            key={i}
            className={`absolute ${note.color} idea-card w-[145px] text-xs font-medium shadow-md`}
            style={{ left: note.x, top: note.y }}
            initial={{ opacity: 0, scale: 0.85, rotate: note.rotate }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: note.rotate,
              y: [0, -5, 0],
            }}
            transition={{
              delay: note.delay + 0.6,
              duration: 0.4,
              y: { delay: note.delay + 1.2, duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            {note.text}
            <div className="flex items-center gap-2 mt-2 opacity-50 text-[10px]">
              <ThumbsUp className="w-2.5 h-2.5" /> {3 + i}
              <MessageCircle className="w-2.5 h-2.5 ml-1" /> {1 + i}
            </div>
          </motion.div>
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.line
            x1="85" y1="55" x2="185" y2="85"
            stroke="hsl(32 95% 58% / 0.25)" strokeWidth="1.5" strokeDasharray="4 4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.5, duration: 0.8 }}
          />
          <motion.line
            x1="100" y1="185" x2="220" y2="225"
            stroke="hsl(160 60% 45% / 0.25)" strokeWidth="1.5" strokeDasharray="4 4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.8, duration: 0.8 }}
          />
        </svg>

        {/* Cursors */}
        {[
          { name: "A", color: "hsl(32 95% 58%)", x: 160, y: 100 },
          { name: "S", color: "hsl(160 60% 45%)", x: 280, y: 250 },
        ].map((c, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            initial={{ x: c.x - 20, y: c.y - 20, opacity: 0 }}
            animate={{ x: [c.x, c.x + 15, c.x + 5], y: [c.y, c.y - 8, c.y + 10], opacity: 1 }}
            transition={{ delay: 2 + i * 0.4, duration: 4, repeat: Infinity, repeatType: "reverse" }}
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill={c.color}>
              <path d="M0 0L12 9.5L4.5 9.5L0 16L0 0Z" />
            </svg>
            <span className="text-[9px] font-bold ml-2 px-1.5 py-0.5 rounded text-primary-foreground" style={{ background: c.color }}>
              {c.name}
            </span>
          </motion.div>
        ))}

        <motion.div
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 border border-border text-[10px] text-muted-foreground text-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Sparkles className="w-3 h-3 text-primary" /> AI generating...
        </motion.div>
      </div>
    </div>
  );
}

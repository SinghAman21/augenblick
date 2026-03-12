import { motion } from "framer-motion";
import { Users, Sparkles, Layers, Vote, MessageSquare, FolderKanban } from "lucide-react";

const features = [
  { icon: Users, title: "Real-time collaboration", desc: "Work with your team simultaneously. Live cursors, presence, instant sync." },
  { icon: Sparkles, title: "AI idea generation", desc: "Describe a challenge and let AI produce dozens of starting points." },
  { icon: Layers, title: "Idea clustering", desc: "Auto-group related ideas so patterns emerge naturally." },
  { icon: Vote, title: "Voting & prioritization", desc: "Upvote the strongest ideas. Rankings update live." },
  { icon: MessageSquare, title: "Discussion threads", desc: "Attach comments to any idea. Threaded, async-friendly." },
  { icon: FolderKanban, title: "Smart organization", desc: "Tags, categories, and AI sorting keep everything findable." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-mono text-xs text-primary mb-3 uppercase tracking-widest">Features</p>
          <h2 className="text-display text-3xl sm:text-4xl max-w-lg">
            Tools that match the speed of thought
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-background p-6 group hover:bg-card transition-colors duration-300"
            >
              <f.icon className="w-5 h-5 text-primary mb-4" />
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

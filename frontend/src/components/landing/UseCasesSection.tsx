import { motion } from "framer-motion";
import { Rocket, Palette, BookOpen, Calendar, Code } from "lucide-react";

const useCases = [
  { icon: Rocket, title: "Startup Ideation", desc: "Brainstorm your next venture with co-founders." },
  { icon: Palette, title: "Product Design", desc: "Explore concepts and gather team feedback." },
  { icon: BookOpen, title: "Research", desc: "Organize topics and explore new directions." },
  { icon: Calendar, title: "Event Planning", desc: "Themes, logistics, and activities — together." },
  { icon: Code, title: "Hackathons", desc: "Scope projects fast, as a team." },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-mono text-xs text-primary mb-3 uppercase tracking-widest">Use cases</p>
          <h2 className="text-display text-3xl sm:text-4xl max-w-md">
            Built for how teams actually brainstorm
          </h2>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="surface-raised p-5 flex-1 min-w-[220px] max-w-[280px] hover:border-primary/30 transition-colors group"
            >
              <uc.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
              <h3 className="font-semibold text-sm mb-1">{uc.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

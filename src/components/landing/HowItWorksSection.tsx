import { motion } from "framer-motion";
import { PlusCircle, Users, Trophy } from "lucide-react";

const steps = [
  { icon: PlusCircle, title: "Create a session", desc: "Pick a topic, invite collaborators, set the ground rules.", num: "01" },
  { icon: Users, title: "Brainstorm together", desc: "Everyone adds ideas at once. AI fills the gaps. Vote in real time.", num: "02" },
  { icon: Trophy, title: "Surface the best", desc: "Clustering + voting reveals winners. Export and ship.", num: "03" },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-mono text-xs text-primary mb-3 uppercase tracking-widest">Process</p>
          <h2 className="text-display text-3xl sm:text-4xl max-w-md">
            Three steps. Zero friction.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative"
            >
              <span className="text-mono text-6xl font-bold text-border/60 leading-none block mb-4">{s.num}</span>
              <div className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

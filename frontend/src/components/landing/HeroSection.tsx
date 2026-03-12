import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingBoard } from "./FloatingBoard";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end pb-20 pt-32 lg:pt-16 lg:items-center overflow-hidden">
      {/* Subtle warm glow */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-20 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px]" />

      <div className="max-w-6xl mx-auto px-5 w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — takes 7 cols for asymmetry */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="tag-primary mb-6 inline-flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              AI-assisted brainstorming
            </motion.div>

            <h1 className="text-display text-5xl sm:text-6xl lg:text-[4.25rem] leading-[1.05] mb-5">
              Where teams
              <br />
              turn raw thinking
              <br />
              into <span className="text-primary">real ideas.</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
              A collaborative workspace for brainstorming, organizing, and
              refining ideas — with AI that actually helps you think.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <Link to="/sign-up">
                <button className="btn-primary flex items-center gap-2">
                  Start brainstorming
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <button className="btn-outline flex items-center gap-2">
                <Play className="w-4 h-4" />
                Watch demo
              </button>
            </div>

            {/* Social proof — minimal */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["38", "160", "32", "280"].map((hue, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-background"
                    style={{ background: `hsl(${hue} 50% 55%)` }}
                  />
                ))}
              </div>
              <span>2,500+ teams · 50k ideas generated</span>
            </div>
          </motion.div>

          {/* Right — 5 cols */}
          <motion.div
            className="lg:col-span-5 hidden lg:block"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <FloatingBoard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

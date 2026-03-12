import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="surface-raised p-10 sm:p-14 relative overflow-hidden"
        >
          {/* Subtle accent glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/8 rounded-full blur-[80px]" />

          <div className="relative z-10 max-w-lg">
            <h2 className="text-display text-3xl sm:text-4xl mb-3">
              Start your first session today
            </h2>
            <p className="text-muted-foreground mb-6">
              Free to start. No credit card. Set up in under a minute.
            </p>
            <Link to="/dashboard">
              <button className="btn-primary flex items-center gap-2">
                Create workspace
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

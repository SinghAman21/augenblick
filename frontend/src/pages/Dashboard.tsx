import { motion } from "framer-motion";
import { Plus, Users, Lightbulb, Clock, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";

const sessions = [
  { id: "1", title: "Q2 Product Roadmap", participants: 5, ideas: 23, lastActive: "2 hours ago", tag: "tag-primary" },
  { id: "2", title: "Mobile App Redesign", participants: 3, ideas: 15, lastActive: "5 hours ago", tag: "tag-secondary" },
  { id: "3", title: "Marketing Campaign Ideas", participants: 8, ideas: 42, lastActive: "1 day ago", tag: "tag-accent" },
  { id: "4", title: "Hackathon 2026 Projects", participants: 12, ideas: 67, lastActive: "3 hours ago", tag: "tag-primary" },
  { id: "5", title: "Onboarding Flow Improvements", participants: 4, ideas: 11, lastActive: "2 days ago", tag: "tag-secondary" },
  { id: "6", title: "AI Feature Brainstorm", participants: 6, ideas: 31, lastActive: "6 hours ago", tag: "tag-accent" },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display text-2xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Your brainstorming sessions</p>
          </div>
          <Link to="/session/create">
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Session
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Active Sessions", value: "6" },
            { label: "Total Ideas", value: "189" },
            { label: "Team Members", value: "24" },
            { label: "This Week", value: "+34" },
          ].map((stat) => (
            <div key={stat.label} className="surface-raised p-4">
              <p className="text-xl font-bold text-display">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground text-mono uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/session/${session.id}`}>
                <div className="surface-raised p-4 hover:border-primary/30 transition-colors group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{session.title}</h3>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground text-mono">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {session.participants}</span>
                    <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> {session.ideas}</span>
                    <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" /> {session.lastActive}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

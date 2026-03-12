import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "AI", href: "#ai" },
  { label: "Use Cases", href: "#use-cases" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-display">IdeaLab</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/sign-in">
            <button className="btn-outline text-sm px-4 py-1.5">Log in</button>
          </Link>
          <Link to="/sign-up">
            <button className="btn-primary text-sm px-4 py-1.5">Get Started →</button>
          </Link>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-background border-t border-border px-5 pb-4"
        >
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="block py-2.5 text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
          <Link to="/sign-up" className="block mt-2">
            <button className="btn-primary text-sm w-full py-2">Get Started →</button>
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}

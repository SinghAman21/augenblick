import { Lightbulb, Github, Twitter, Linkedin } from "lucide-react";

const links = {
  Product: ["Features", "Pricing", "Changelog"],
  Resources: ["Docs", "Blog", "Community"],
  Company: ["About", "Contact", "Privacy"],
};

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Lightbulb className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-display">IdeaLab</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs mb-4 leading-relaxed">
              Collaborative brainstorming for teams that think big.
            </p>
            <div className="flex gap-2">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-8 pt-5 text-center text-[11px] text-muted-foreground text-mono">
          © 2026 IdeaLab
        </div>
      </div>
    </footer>
  );
}

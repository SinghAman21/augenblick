import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useTheme } from "@/contexts/ThemeContext";

export function GlobalThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "claude";

  return (
    <div className="fixed top-3 right-40 z-[60]">
      <Toggle
        aria-label="Toggle theme"
        variant="outline"
        size="sm"
        pressed={isLight}
        onPressedChange={(pressed) => setTheme(pressed ? "claude" : "default")}
        className="h-9 w-9 p-0 bg-background/80 backdrop-blur border-border/70"
      >
        {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Toggle>
    </div>
  );
}

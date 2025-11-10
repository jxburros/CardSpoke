import { Home, Moon, Sun, Menu, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { SimpleMenu, SimpleMenuItem } from "./SimpleMenu";

interface HeaderProps {
  theme: 'light' | 'dark';
  styleMode: 'classic' | 'minimal';
  onThemeToggle: () => void;
  onStyleToggle: () => void;
  onHome: () => void;
  onBack: () => void;
  onAddCard: () => void;
  onUpload: () => void;
  onManageMods: () => void;
  onInstance: () => void;
  onExport: (type: string) => void;
}

const exportMenuItems = [
  { label: "Instance (JSON)", value: "instance-json" },
  { label: "Instance (TXT)", value: "instance-txt" },
  { label: "Active Extensions (JSON)", value: "mods-json" }
];

export function Header({
  theme,
  styleMode,
  onThemeToggle,
  onStyleToggle,
  onHome,
  onBack,
  onAddCard,
  onUpload,
  onManageMods,
  onInstance,
  onExport
}: HeaderProps) {
  const menuItems: SimpleMenuItem[] = [
    { label: "New Card", onSelect: onAddCard },
    { label: "Upload Content", onSelect: onUpload },
    { label: "Manage Extensions", onSelect: onManageMods },
    { label: "Switch Instance", onSelect: onInstance },
    { label: styleMode === 'minimal' ? 'Style · Minimal' : 'Style · Classic', disabled: true },
    ...exportMenuItems.map((item) => ({ label: item.label, onSelect: () => onExport(item.value) }))
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="bg-background"
    >
      <div
        className="mx-auto max-w-6xl px-6 pb-12 md:px-16"
        style={{ paddingTop: "6rem" }}
      >
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-6">
            <h1
              className="text-[64px] font-semibold leading-[0.95] tracking-tight text-foreground"
              style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
            >
              CardSpoke
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              A calm workspace for thinking in connected cards. Outline ideas, expand details, and resurface knowledge without losing the thread.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/80">
              <span className="uppercase tracking-[0.3em]">Style · {styleMode === "minimal" ? "Minimal" : "Classic"}</span>
              <span className="uppercase tracking-[0.3em]">Theme · {theme === "light" ? "Day" : "Night"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <Button
              variant="secondary"
              size="icon"
              onClick={onHome}
              aria-label="Go home"
            >
              <Home className="h-5 w-5" strokeWidth={1.4} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.4} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onThemeToggle} aria-label="Toggle theme">
              {theme === "light" ? (
                <Moon className="h-5 w-5" strokeWidth={1.4} />
              ) : (
                <Sun className="h-5 w-5" strokeWidth={1.4} />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onStyleToggle} aria-label="Toggle style">
              <Sparkles className="h-5 w-5" strokeWidth={1.4} />
            </Button>
            <SimpleMenu
              triggerIcon={<Menu className="h-5 w-5" strokeWidth={1.4} />}
              triggerLabel="Open primary menu"
              items={menuItems}
              triggerClassName="h-12 w-12 rounded-full bg-foreground text-background hover:bg-foreground/90"
              menuClassName="backdrop-blur-lg"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

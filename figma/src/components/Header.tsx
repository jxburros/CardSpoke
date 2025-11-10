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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-background"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-8 pb-16 pt-20 md:px-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          {/* Logo */}
          <div className="space-y-5">
            <h1
              className="text-[60px] font-semibold leading-[0.9] tracking-tight text-foreground"
              style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
            >
              CardSpoke
            </h1>
            <p className="max-w-sm text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Card-Based Information Repository
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onHome}
              className="h-12 w-12 rounded-full bg-foreground/90 text-background transition hover:bg-foreground"
            >
              <Home className="h-5 w-5" strokeWidth={1.5} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-12 w-12 rounded-full bg-foreground/10 text-foreground transition hover:bg-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="h-12 w-12 rounded-full bg-foreground/10 text-foreground transition hover:bg-foreground/20"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Sun className="h-5 w-5" strokeWidth={1.5} />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onStyleToggle}
              className="h-12 w-12 rounded-full bg-foreground/10 text-foreground transition hover:bg-foreground/20"
            >
              <Sparkles className="h-5 w-5" strokeWidth={1.5} />
            </Button>

            <SimpleMenu
              triggerIcon={<Menu className="h-5 w-5" strokeWidth={1.5} />}
              triggerLabel="Open primary menu"
              items={menuItems}
              triggerClassName="h-12 w-12 rounded-full bg-foreground/90 text-background hover:bg-foreground"
              menuClassName="backdrop-blur-xl"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

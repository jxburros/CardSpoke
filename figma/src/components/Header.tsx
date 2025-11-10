import { ReactNode } from "react";
import {
  Home,
  Moon,
  Sun,
  ArrowLeft,
  Sparkles,
  Plus,
  UploadCloud,
  Puzzle,
  Database,
  Search,
  ArrowDownToLine
} from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { SimpleMenu } from "./SimpleMenu";
import { cn } from "./ui/utils";

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
  onFocusSearch: () => void;
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
  onFocusSearch,
  onExport
}: HeaderProps) {
  const quickActions: { key: string; label: string; onClick: () => void; icon: ReactNode }[] = [
    {
      key: "add",
      label: "New Card",
      onClick: onAddCard,
      icon: <Plus className="h-4 w-4" strokeWidth={1.5} />
    },
    {
      key: "upload",
      label: "Upload Content",
      onClick: onUpload,
      icon: <UploadCloud className="h-4 w-4" strokeWidth={1.5} />
    },
    {
      key: "mods",
      label: "Manage Extensions",
      onClick: onManageMods,
      icon: <Puzzle className="h-4 w-4" strokeWidth={1.5} />
    },
    {
      key: "instance",
      label: "Switch Instance",
      onClick: onInstance,
      icon: <Database className="h-4 w-4" strokeWidth={1.5} />
    },
    {
      key: "style",
      label: styleMode === 'minimal' ? 'Style · Minimal' : 'Style · Classic',
      onClick: onStyleToggle,
      icon: <Sparkles className="h-4 w-4" strokeWidth={1.5} />
    },
    {
      key: "search",
      label: "Search",
      onClick: onFocusSearch,
      icon: <Search className="h-4 w-4" strokeWidth={1.5} />
    }
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-background"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-12 pt-16 md:px-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Card-Based Information Repository
            </p>
            <h1
              className="text-[64px] font-semibold leading-[0.9] text-foreground md:text-[72px]"
              style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
            >
              CardSpoke
            </h1>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.key}
              type="button"
              variant="ghost"
              onClick={action.onClick}
              className={cn(
                "h-12 rounded-full bg-foreground/[0.05] px-6 text-sm font-medium text-foreground transition hover:bg-foreground/[0.1]",
                action.key === "style" && styleMode === 'minimal' && "bg-foreground/[0.12]"
              )}
            >
              <span className="flex items-center gap-2">
                {action.icon}
                {action.label}
              </span>
            </Button>
          ))}

          <SimpleMenu
            variant="pill"
            triggerIcon={
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowDownToLine className="h-4 w-4" strokeWidth={1.5} />
                Download
              </span>
            }
            triggerLabel="Download data"
            items={exportMenuItems.map((item) => ({
              label: item.label,
              onSelect: () => onExport(item.value)
            }))}
            triggerClassName="bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]"
            menuClassName="backdrop-blur-xl"
          />
        </div>
      </div>
    </motion.header>
  );
}

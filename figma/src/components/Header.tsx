import { Home, Moon, Sun, Menu, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { motion } from "motion/react";

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
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-background border-b border-border"
    >
      <div className="max-w-6xl mx-auto px-16 py-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div>
            <h1 className="text-foreground text-[56px] font-[Inter] font-bold leading-none">CardSpoke</h1>
            <p className="text-muted-foreground tracking-wide uppercase text-xs mt-2">Card-Based Information Repository</p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onHome}
              className="hover:bg-accent transition-all duration-500 w-11 h-11 text-foreground rounded-full"
            >
              <Home className="w-5 h-5" strokeWidth={1.5} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-accent transition-all duration-500 w-11 h-11 text-foreground rounded-full"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="hover:bg-accent transition-all duration-500 w-11 h-11 text-foreground rounded-full"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Sun className="w-5 h-5" strokeWidth={1.5} />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onStyleToggle}
              className="hover:bg-accent transition-all duration-500 w-11 h-11 text-foreground rounded-full"
            >
              <Sparkles className="w-5 h-5" strokeWidth={1.5} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent transition-all duration-500 w-11 h-11 text-foreground rounded-full"
                >
                  <Menu className="w-5 h-5" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 mt-2">
                <DropdownMenuItem onClick={onAddCard} className="cursor-pointer py-3 text-sm">
                  New Card
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onUpload} className="cursor-pointer py-3 text-sm">
                  Upload Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onManageMods} className="cursor-pointer py-3 text-sm">
                  Manage Extensions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onInstance} className="cursor-pointer py-3 text-sm">
                  Switch Instance
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="py-2 text-xs text-muted-foreground">
                  Style Mode: {styleMode === 'minimal' ? 'Minimal' : 'Classic'}
                </DropdownMenuItem>
                <div className="border-t border-border my-2" />
                {exportMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => onExport(item.value)}
                    className="cursor-pointer py-3 text-sm"
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

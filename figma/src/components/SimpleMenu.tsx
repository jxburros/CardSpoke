import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "./ui/utils";

export interface SimpleMenuItem {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  hint?: string;
}

interface SimpleMenuProps {
  triggerIcon: ReactNode;
  triggerLabel: string;
  items: SimpleMenuItem[];
  triggerClassName?: string;
  menuClassName?: string;
}

export function SimpleMenu({
  triggerIcon,
  triggerLabel,
  items,
  triggerClassName,
  menuClassName
}: SimpleMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full bg-foreground/90 text-background transition hover:bg-foreground",
          triggerClassName
        )}
      >
        {triggerIcon}
        <span className="sr-only">{triggerLabel}</span>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-20 mt-4 w-64 rounded-3xl bg-background/95 p-5 text-sm text-foreground shadow-[0_32px_80px_rgba(17,17,17,0.15)] backdrop-blur",
            "space-y-2",
            menuClassName
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect?.();
                setOpen(false);
              }}
              className={cn(
                "w-full rounded-2xl px-4 py-3 text-left transition",
                item.disabled
                  ? "text-muted-foreground/70"
                  : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <div className="font-medium leading-snug">{item.label}</div>
              {item.hint && <div className="mt-1 text-xs text-muted-foreground/70">{item.hint}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

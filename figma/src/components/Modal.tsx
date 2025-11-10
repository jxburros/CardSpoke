import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, title, className, children }: ModalProps) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setMountNode(document.body);
    }
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  if (!open || !mountNode) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 bg-foreground/10 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[36px] bg-background/95 p-8 shadow-[0_40px_120px_rgba(17,17,17,0.18)]",
          className
        )}
      >
        {title && <h2 className="text-2xl font-semibold text-foreground">{title}</h2>}
        <button
          type="button"
          className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 text-foreground transition hover:bg-foreground/20"
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
        >
          ×
        </button>
        <div className="mt-6 space-y-6 text-foreground">{children}</div>
      </div>
    </div>,
    mountNode
  );
}

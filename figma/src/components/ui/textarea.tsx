import { forwardRef } from "react";
import { cn } from "../cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-3xl border border-transparent bg-muted/20 px-5 py-4 text-base leading-relaxed text-foreground transition focus:border-foreground/20 focus:bg-muted/30 focus:outline-none",
        className
      )}
      {...props}
    />
  );
});

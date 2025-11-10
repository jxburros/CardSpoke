import { forwardRef } from "react";
import { cn } from "../cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-full border border-transparent bg-muted/25 px-5 py-3 text-base text-foreground transition focus:border-foreground/20 focus:bg-muted/35 focus:outline-none",
        className
      )}
      {...props}
    />
  );
});

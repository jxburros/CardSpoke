import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-12 w-full min-w-0 rounded-full border-0 bg-card px-6 py-3 text-base text-foreground transition focus:outline-none focus:ring-0 file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [box-shadow:var(--shadow-soft)] focus:[box-shadow:var(--shadow-strong)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

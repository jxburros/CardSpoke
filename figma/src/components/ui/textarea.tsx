import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[220px] w-full resize-none rounded-[36px] border-0 bg-card px-6 py-6 text-base leading-relaxed text-foreground transition focus:outline-none focus:ring-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [box-shadow:var(--shadow-soft)] focus:[box-shadow:var(--shadow-strong)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

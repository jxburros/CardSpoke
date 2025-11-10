import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[180px] w-full resize-none rounded-[36px] border-0 bg-foreground/[0.05] px-6 py-5 text-base leading-relaxed text-foreground transition focus:bg-foreground/[0.1] focus:shadow-[0_18px_48px_rgba(17,17,17,0.12)] focus:outline-none focus:ring-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

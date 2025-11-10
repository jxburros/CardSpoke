import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background shadow-[0_18px_40px_rgba(17,17,17,0.18)] hover:bg-foreground/90",
        destructive:
          "bg-destructive text-white shadow-[0_18px_40px_rgba(212,24,61,0.25)] hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "bg-foreground/10 text-foreground hover:bg-foreground/16",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-foreground/10 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-8 has-[>svg]:px-5",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

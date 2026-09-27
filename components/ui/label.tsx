"use client";

import * as React from "react";
import { cn } from "cn";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-xs leading-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",

        // Only labels containing a radio item
        "has-[[data-slot=radio-group-item]]:flex-1",
        "has-[[data-slot=radio-group-item]]:w-full",
        "has-[[data-slot=radio-group-item]]:cursor-pointer",
        "has-[[data-slot=radio-group-item]]:items-center",
        "has-[[data-slot=radio-group-item]]:gap-2.5",
        "has-[[data-slot=radio-group-item]]:border",
        "has-[[data-slot=radio-group-item]]:border-input",
        "has-[[data-slot=radio-group-item]]:px-3",
        "has-[[data-slot=radio-group-item]]:py-2.5",
        "has-[[data-slot=radio-group-item]]:hover:bg-muted/50",

        // Selected radio
        "has-[[data-checked]]:border-foreground/30",
        "has-[[data-checked]]:bg-muted",
        "has-[[data-state=checked]]:border-foreground/30",
        "has-[[data-state=checked]]:bg-muted",

        "has-[[data-slot=radio-group-item]:focus-visible]:border-ring",
        "has-[[data-slot=radio-group-item]:focus-visible]:ring-1",
        "has-[[data-slot=radio-group-item]:focus-visible]:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };

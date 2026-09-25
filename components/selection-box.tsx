import { cn } from "cn";

export function SelectionBox({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full cursor-pointer items-start gap-2.5 border-input px-3 py-2.5 text-xs",
        "hover:bg-muted/50",
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

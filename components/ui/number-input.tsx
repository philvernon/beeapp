import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

interface NumberInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  step?: number;
  min?: number;
  max?: number;
}

const DEFAULT_STEP = 1;

function NumberInput({
  value,
  onChange,
  step = DEFAULT_STEP,
  min,
  max,
  className,
  ...inputProps
}: NumberInputProps) {
  const displayValue = value ?? "";

  function clamp(v: number) {
    if (min !== undefined && v < min) return min;
    if (max !== undefined && v > max) return max;
    return v;
  }

  function adjust(delta: number) {
    const current = typeof value === "number" ? value : Number(value) || 0;
    const next = clamp(current + delta);
    // Preserve decimal precision from step
    const rounded = Number(next.toFixed(10));
    onChange(rounded);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onChange(null);
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    const clamped = clamp(parsed);
    // If the current value is a string, emit a string to match the form's expected type
    if (typeof value === "string") {
      onChange(String(clamped));
    } else {
      onChange(clamped);
    }
  }

  return (
    <div className={cn("flex w-full items-center gap-0", className)}>
      <ButtonPrimitive
        aria-label="Decrease value"
        data-slot="number-input-decrement"
        onClick={() => adjust(-step)}
        className={cn(
          "h-8 w-8 shrink-0 border border-r-0 border-input bg-transparent text-foreground transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50",
          "rounded-l-md rounded-r-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
        )}
      >
        −
      </ButtonPrimitive>
      <InputPrimitive
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleInputChange}
        data-slot="number-input-value"
        className={cn(
          "h-8 w-full min-w-0 border-y border-input bg-transparent px-2 text-center text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
          "rounded-none aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
        )}
        {...inputProps}
      />
      <ButtonPrimitive
        aria-label="Increase value"
        data-slot="number-input-increment"
        onClick={() => adjust(step)}
        className={cn(
          "h-8 w-8 shrink-0 border border-l-0 border-input bg-transparent text-foreground transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50",
          "rounded-r-md rounded-l-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
        )}
      >
        +
      </ButtonPrimitive>
    </div>
  );
}

export { NumberInput };

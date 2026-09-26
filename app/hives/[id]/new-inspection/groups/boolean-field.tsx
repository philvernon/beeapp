"use client";

import { useController, useFormContext } from "react-hook-form";

import { Field, FieldDescription } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface BooleanFieldProps {
  name: string;
  label: string;
}

export function BooleanField({ name, label }: BooleanFieldProps) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });

  return (
    <RadioGroup
      value={field.value}
      onValueChange={(value) => {
        field.onChange(value);
      }}
    >
      <Field data-invalid={fieldState.invalid}>
        <FieldDescription>{label}</FieldDescription>
        <div className="flex gap-4">
          <Label>
            <RadioGroupItem value={true} />
            <span>Yes</span>
          </Label>
          <Label>
            <RadioGroupItem value={false} />
            <span>No</span>
          </Label>
        </div>
      </Field>
    </RadioGroup>
  );
}

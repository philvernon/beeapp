"use client";

import { useController, useFormContext } from "react-hook-form";

import { SelectionBox } from "@/components/selection-box";
import { Field, FieldDescription } from "@/components/ui/field";
import { RadioGroup } from "@base-ui/react";
import { RadioGroupItem } from "@/components/ui/radio-group";
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
            <SelectionBox>
              <RadioGroupItem value={true} />
              <span>Yes</span>
            </SelectionBox>
          </Label>
          <Label>
            <SelectionBox>
              <RadioGroupItem value={false} />
              <span>No</span>
            </SelectionBox>
          </Label>
        </div>
      </Field>
    </RadioGroup>
  );
}

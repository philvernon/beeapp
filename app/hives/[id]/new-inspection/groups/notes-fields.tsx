import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { weatherConditionLabels } from "@/lib/schema";

export function NotesFields() {
  const { control } = useFormContext<InspectionWizardValue>();

  return (
    <FieldSet>
      <FieldGroup>
        <Controller
          name="weatherTemperatureC"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Temperature (°C)</FieldLabel>
              <NumberInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v === null ? null : String(v))}
                step={0.1}
              />
            </Field>
          )}
        />
        <Controller
          name="weatherCondition"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Condition</FieldLabel>
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <div className="flex flex-wrap gap-1">
                  {Object.entries(weatherConditionLabels).map(([k, v]) => (
                    <Label key={k}>
                      <RadioGroupItem value={k} />
                      <span>{v}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                rows={3}
                placeholder="Any additional observations…"
              />
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  );
}

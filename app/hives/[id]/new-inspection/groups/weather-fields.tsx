import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldLabel, FieldGroup, FieldSet } from "@/components/ui/field";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { Input } from "@/components/ui/input";

export function WeatherFields() {
  const { control } = useFormContext<InspectionWizardValue>();

  return (
    <FieldSet>
      <FieldGroup>
        <Controller
          name="temperamentScore"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Temperament score</FieldLabel>
              <Input
                type="number"
                min="1"
                max="10"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </Field>
          )}
        />
        <Controller
          name="feedLitresLightSyrup"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Light syrup (litres)</FieldLabel>
              <Input
                type="number"
                step="0.25"
                min="0"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </Field>
          )}
        />
        <Controller
          name="feedLitresHeavySyrup"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Heavy syrup (litres)</FieldLabel>
              <Input
                type="number"
                step="0.25"
                min="0"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </Field>
          )}
        />
        <Controller
          name="supersChange"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Supers change</FieldLabel>
              <Input
                type="number"
                step="0.5"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  );
}

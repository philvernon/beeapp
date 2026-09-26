import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldLabel, FieldGroup, FieldSet } from "@/components/ui/field";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { NumberInput } from "@/components/ui/number-input";

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
              <NumberInput
                value={field.value ?? null}
                onChange={field.onChange}
                step={1}
                min={1}
                max={10}
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
              <NumberInput
                value={field.value ?? null}
                onChange={(v) =>
                  field.onChange(
                    v === null ? null : String(v),
                  )
                }
                step={0.25}
                min={0}
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
              <NumberInput
                value={field.value ?? null}
                onChange={(v) =>
                  field.onChange(
                    v === null ? null : String(v),
                  )
                }
                step={0.25}
                min={0}
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
              <NumberInput
                value={field.value ?? null}
                onChange={(v) =>
                  field.onChange(
                    v === null ? null : String(v),
                  )
                }
                step={0.5}
              />
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  );
}

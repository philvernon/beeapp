import { Controller, useFormContext } from "react-hook-form";

import { BooleanField } from "./boolean-field";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { NumberInput } from "@/components/ui/number-input";

export function ColonyFields() {
  const { control } = useFormContext<InspectionWizardValue>();

  return (
    <FieldSet>
      <FieldGroup>
        <BooleanField name="eggsSeen" label="Eggs seen" />
        <BooleanField name="broodPatternOk" label="Brood pattern OK" />
        <Controller
          name="broodFrameCount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Brood frame count</FieldLabel>
              <NumberInput
                value={field.value ?? null}
                onChange={field.onChange}
              />
            </Field>
          )}
        />
        <Controller
          name="storeFrames"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Store frames</FieldLabel>
              <NumberInput
                value={field.value ?? null}
                onChange={field.onChange}
              />
            </Field>
          )}
        />
        <Controller
          name="roomFrames"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Room frames</FieldLabel>
              <NumberInput
                value={field.value ?? null}
                onChange={field.onChange}
              />
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  );
}

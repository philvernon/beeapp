import { Controller, useFormContext } from "react-hook-form";

import { BooleanField } from "@/components/ui/boolean-field";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { Input } from "@/components/ui/input";

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
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </Field>
          )} />
        <Controller
          name="storeFrames"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Store frames</FieldLabel>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </Field>
          )} />
        <Controller
          name="roomFrames"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Room frames</FieldLabel>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </Field>
          )} />
      </FieldGroup>
    </FieldSet>
  );
}

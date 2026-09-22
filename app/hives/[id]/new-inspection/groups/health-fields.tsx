import { Controller, useFormContext, useWatch } from "react-hook-form";

import { BooleanField } from "@/components/ui/boolean-field";
import { SelectionBox } from "@/components/selection-box";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@base-ui/react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { varroaLevelLabels } from "@/lib/schema";
import { Input } from "@/components/ui/input";

export function HealthFields() {
  const { control } = useFormContext<InspectionWizardValue>();
  const healthOk = useWatch({ control, name: "healthOk" });

  return (
    <FieldSet>
      <FieldGroup>
        <BooleanField name="healthOk" label="No disease signs" />
        {healthOk === false && (
          <BooleanField name="chalkBroodSuspected" label="Chalk brood suspected" />
        )}
        {healthOk === false && (
          <BooleanField name="efbSuspected" label="EFB suspected" />
        )}
        {healthOk === false && (
          <BooleanField name="afbSuspected" label="AFB suspected" />
        )}
        <Controller
          name="varroaLevel"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Varroa level</FieldLabel>
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={(value) => { field.onChange(value) }}
              >
                <div className="flex gap-1">
                  {Object.entries(varroaLevelLabels).map(([k, v]) => (
                    <Label key={k}>
                      <SelectionBox>
                        <RadioGroupItem value={k} />
                        <span>{v}</span>
                      </SelectionBox>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </Field>
          )} />
        <Controller
          name="varroaCount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Varroa count</FieldLabel>
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

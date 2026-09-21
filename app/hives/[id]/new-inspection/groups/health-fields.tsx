import { Controller, useFormContext, useWatch } from "react-hook-form";

import { SelectionBox } from "@/components/selection-box";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@base-ui/react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { varroaLevelLabels } from "@/lib/schema";
import { Input } from "@/components/ui/input";

const stringToBoolean = (boolString: string) => {
  return boolString === "true";
}

export function HealthFields() {
  const { control } = useFormContext<InspectionWizardValue>();
  const healthOk = useWatch({ control, name: "healthOk" });

  return (
    <FieldSet>
      <FieldGroup>
        <Controller
          name="healthOk"
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              value={field.value == null ? "" : String(field.value)}
              onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
            >
              <Field data-invalid={fieldState.invalid}>
                <FieldDescription>No disease signs</FieldDescription>
                <div className="flex gap-4">
                  <Label>
                    <SelectionBox>
                      <RadioGroupItem value="true" />
                      <span>Yes</span>
                    </SelectionBox>
                  </Label>
                  <Label>
                    <SelectionBox>
                      <RadioGroupItem value="false" />
                      <span>No</span>
                    </SelectionBox>
                  </Label>
                </div>
              </Field>
            </RadioGroup>
          )} />
        {healthOk === false && (
          <Controller
            name="chalkBroodSuspected"
            control={control}
            render={({ field, fieldState }) => (
              <RadioGroup
                value={field.value == null ? "" : String(field.value)}
                onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
              >
                <Field data-invalid={fieldState.invalid}>
                  <FieldDescription>Chalk brood suspected</FieldDescription>
                  <div className="flex gap-4">
                    <Label>
                      <SelectionBox>
                        <RadioGroupItem value="true" />
                        <span>Yes</span>
                      </SelectionBox>
                    </Label>
                    <Label>
                      <SelectionBox>
                        <RadioGroupItem value="false" />
                        <span>No</span>
                      </SelectionBox>
                    </Label>
                  </div>
                </Field>
              </RadioGroup>
            )} />
        )}
        {healthOk === false && (
          <Controller
            name="efbSuspected"
            control={control}
            render={({ field, fieldState }) => (
              <RadioGroup
                value={field.value == null ? "" : String(field.value)}
                onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
              >
                <Field data-invalid={fieldState.invalid}>
                  <FieldDescription>EFB suspected</FieldDescription>
                  <div className="flex gap-4">
                    <Label>
                      <SelectionBox>
                        <RadioGroupItem value="true" />
                        <span>Yes</span>
                      </SelectionBox>
                    </Label>
                    <Label>
                      <SelectionBox>
                        <RadioGroupItem value="false" />
                        <span>No</span>
                      </SelectionBox>
                    </Label>
                  </div>
                </Field>
              </RadioGroup>
            )} />
        )}
        {healthOk === false && (
          <Controller
            name="afbSuspected"
            control={control}
            render={({ field, fieldState }) => (
              <RadioGroup
                value={field.value == null ? "" : String(field.value)}
                onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
              >
                <Field data-invalid={fieldState.invalid}>
                  <FieldDescription>AFB suspected</FieldDescription>
                  <div className="flex gap-4">
                    <Label>
                      <SelectionBox>
                        <RadioGroupItem value="true" />
                        <span>Yes</span>
                      </SelectionBox>
                    </Label>
                    <Label>
                      <SelectionBox>
                        <RadioGroupItem value="false" />
                        <span>No</span>
                      </SelectionBox>
                    </Label>
                  </div>
                </Field>
              </RadioGroup>
            )} />
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

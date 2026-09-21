import { Controller, useFormContext } from "react-hook-form";

import { SelectionBox } from "@/components/selection-box";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@base-ui/react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { Input } from "@/components/ui/input";

const stringToBoolean = (boolString: string) => {
  return boolString === "true";
}

export function ColonyFields() {
  const { control } = useFormContext<InspectionWizardValue>();

  return (
    <FieldSet>
      <FieldGroup>
        <Controller
          name="eggsSeen"
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              value={field.value == null ? "" : String(field.value)}
              onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
            >
              <Field data-invalid={fieldState.invalid}>
                <FieldDescription>Eggs seen</FieldDescription>
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
        <Controller
          name="broodPatternOk"
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              value={field.value == null ? "" : String(field.value)}
              onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
            >
              <Field data-invalid={fieldState.invalid}>
                <FieldDescription>Brood pattern OK</FieldDescription>
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

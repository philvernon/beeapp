import { Controller, useFormContext, useWatch } from "react-hook-form";

import { SelectionBox } from "@/components/selection-box";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@base-ui/react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { queenColourLabels } from "@/lib/schema";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { Input } from "@/components/ui/input";

const stringToBoolean = (boolString: string) => {
  return boolString === "true";
}

export function QueenFields() {
  const { control } = useFormContext<InspectionWizardValue>();
  const queenSeen = useWatch({
    control,
    name: "queenSeen",
  })

  return (
    <FieldSet>
      <FieldGroup>
        <Controller
          name="queenSeen"
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              value={field.value == null ? "" : String(field.value)}
              onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
            >
              <Field data-invalid={fieldState.invalid}>
                <FieldDescription>Queen seen</FieldDescription>
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
          name="queenCellsRemoved"
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              value={field.value == null ? "" : String(field.value)}
              onValueChange={(value) => { field.onChange(stringToBoolean(value)) }}
            >
              <Field data-invalid={fieldState.invalid}>
                <FieldDescription>Queen cells removed</FieldDescription>
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
          name="queenCellsFound"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Cells found</FieldLabel>
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
      {
        queenSeen === true &&
        <Controller
          name="queenColour"
          shouldUnregister
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(value) => { field.onChange(value) }}
            >
              <Field data-invalid={fieldState.invalid}>
                <FieldDescription>Queen colour</FieldDescription>
                <div className="flex gap-1">
                  {
                    Object.entries(queenColourLabels).map(([k, v]) => (
                      <Label key={k}>
                        <SelectionBox>
                          <RadioGroupItem value={k} />
                          <span>{v}</span>
                        </SelectionBox>
                      </Label>
                    ))
                  }
                </div>
              </Field>
            </RadioGroup>
          )} />
      }
    </FieldSet>
  )
}

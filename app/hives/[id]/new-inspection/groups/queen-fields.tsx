"use client";

import { useEffect, useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { BooleanField } from "./boolean-field";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { queenColourLabels } from "@/lib/inspection-options";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { NumberInput } from "@/components/ui/number-input";

export function QueenFields() {
  const { control, unregister } = useFormContext<InspectionWizardValue>();
  const queenSeen = useWatch({ control, name: "queenSeen" });
  const prevQueenSeenRef = useRef(queenSeen);

  useEffect(() => {
    if (prevQueenSeenRef.current === true && queenSeen === false) {
      unregister("queenColour");
    }
    prevQueenSeenRef.current = queenSeen;
  }, [queenSeen, unregister]);

  return (
    <FieldSet>
      <FieldGroup>
        <BooleanField name="queenSeen" label="Queen seen" />
        <BooleanField name="queenCellsRemoved" label="Queen cells removed" />
        <Controller
          name="queenCellsFound"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Cells found</FieldLabel>
              <NumberInput
                value={field.value ?? null}
                onChange={field.onChange}
              />
            </Field>
          )}
        />
        {queenSeen === true && (
          <Controller
            name="queenColour"
            control={control}
            render={({ field, fieldState }) => (
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={(value) => {
                  if (value) field.onChange(value);
                }}
              >
                <Field data-invalid={fieldState.invalid}>
                  <FieldDescription>Queen colour</FieldDescription>
                  <div className="flex flex-wrap">
                    {Object.entries(queenColourLabels).map(([k, v]) => (
                      <Label key={k}>
                        <RadioGroupItem value={k} />
                        <span>{v}</span>
                      </Label>
                    ))}
                  </div>
                </Field>
              </RadioGroup>
            )}
          />
        )}
      </FieldGroup>
    </FieldSet>
  );
}

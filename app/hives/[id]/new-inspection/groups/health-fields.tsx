import { useEffect, useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { BooleanField } from "./boolean-field";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { varroaLevelLabels } from "@/lib/inspection-options";
import { NumberInput } from "@/components/ui/number-input";

export function HealthFields() {
  const { control, unregister } = useFormContext<InspectionWizardValue>();
  const healthOk = useWatch({ control, name: "healthOk" });
  const prevHealthOkRef = useRef(healthOk);

  useEffect(() => {
    if (prevHealthOkRef.current === false && healthOk === true) {
      unregister(["chalkBroodSuspected", "efbSuspected", "afbSuspected"]);
    }
    prevHealthOkRef.current = healthOk;
  }, [healthOk, unregister]);

  return (
    <FieldSet>
      <FieldGroup>
        <BooleanField name="healthOk" label="No disease signs" />
        {healthOk === false && (
          <BooleanField
            name="chalkBroodSuspected"
            label="Chalk brood suspected"
          />
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
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <div className="flex flex-wrap gap-1">
                  {Object.entries(varroaLevelLabels).map(([k, v]) => (
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
          name="varroaCount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Varroa count</FieldLabel>
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

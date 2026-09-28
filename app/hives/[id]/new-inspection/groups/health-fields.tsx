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
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { varroaLevelLabels } from "@/lib/inspection-options";

export function HealthFields() {
  const { control, setValue, unregister } =
    useFormContext<InspectionWizardValue>();
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
        <Controller
          name="healthOk"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldDescription>Disease</FieldDescription>
              <RadioGroup
                value={String(!field.value)}
                onValueChange={(value) => {
                  setValue("healthOk", value === "false", {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              >
                <div className="flex gap-4">
                  <Label>
                    <RadioGroupItem value="true" />
                    <span>Yes</span>
                  </Label>
                  <Label>
                    <RadioGroupItem value="false" />
                    <span>No</span>
                  </Label>
                </div>
              </RadioGroup>
            </Field>
          )}
        />
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
      </FieldGroup>
    </FieldSet>
  );
}

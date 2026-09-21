import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { Controller, useFormContext } from "react-hook-form";

export function ColonyFields() {
  const { control } = useFormContext<InspectionWizardValue>();

  return (
    <FieldSet>
      <FieldGroup>
        <Controller name="broodPatternOk" control={control}
          render={({ field, fieldState }) => (

            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Label>
                <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />
                Brood pattern OK?
              </Label>
            </Field>
          )} />
      </FieldGroup>
    </FieldSet>

  );
}


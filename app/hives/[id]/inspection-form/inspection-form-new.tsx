import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import {
  InspectionWizardSchema,
  type InspectionWizardInput,
} from "@/lib/inspection-wizard-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QueenFields } from "./groups/queen-fields";
import { ColonyFields } from "./groups/colony-fields";
import { HealthFields } from "./groups/health-fields";
import { WeatherFields } from "./groups/weather-fields";
import { NotesFields } from "./groups/notes-fields";

function Previous({ previous }) {
  return <Button onClick={previous}>Previous</Button>;
}

function Next({ next }) {
  return <Button onClick={next}>Next</Button>;
}

export function InspectionForm() {
  const defaultValues = InspectionWizardSchema.parse({});
  const methods = useForm<InspectionWizardInput>({
    resolver: zodResolver(InspectionWizardSchema),
    defaultValues,
  });

  const steps = [
    QueenFields,
    ColonyFields,
    HealthFields,
    WeatherFields,
    NotesFields,
  ];

  const stepFields = [
    ["queenSeen", "queenColour", "queenCellsFound", "queenCellsRemoved"],
    ["eggsSeen", "broodPatternOk", "broodFrameCount"],
    [
      "healthOk",
      "chalkBroodSuspected",
      "efbSuspected",
      "afbSuspected",
      "varroaLevel",
      "varroaCount",
    ],
    [
      "temperamentScore",
      "feedLitresLightSyrup",
      "feedLitresHeavySyrup",
      "supersChange",
    ],
    ["weatherTemperatureC", "weatherCondition", "notes"],
  ] satisfies (keyof InspectionWizardInput)[][];

  const [stepIndex, setStepIndex] = useState(0);

  async function next() {
    const valid = await methods.trigger(stepFields[stepIndex]);

    if (valid && stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }

  function previous() {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }

  function handleSubmit(data: InspectionWizardInput) {
    console.log("submit");
    console.log(data);
  }

  const Step = steps[stepIndex];

  return (
    <div>
      <FormProvider {...methods}>
        <form
          id="new-inspection-form"
          onSubmit={methods.handleSubmit(handleSubmit)}
        >
          <Step />

          <div className="py-2 flex justify-end">
            {stepIndex > 0 && <Previous previous={previous} />}
            {stepIndex < steps.length - 1 && <Next next={next} />}
            {stepIndex === steps.length - 1 && (
              <Button type="submit" form="new-inspection-form">
                Submit
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

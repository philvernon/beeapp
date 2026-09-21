import { FormProvider, useForm } from "react-hook-form";
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
import { InspectionInsert } from "@/lib/schema";
import { getErrorMessage } from "@/lib/fetch";
import { useRouter } from "next/navigation";

function Previous({ previous }: { previous: () => void }) {
  return <Button onClick={previous}>Previous</Button>;
}

function Next({ next }: { next: () => void }) {
  return <Button onClick={next}>Next</Button>;
}

export function InspectionForm({ hiveId }: { hiveId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    [
      "eggsSeen",
      "broodPatternOk",
      "broodFrameCount",
      "storeFrames",
      "roomFrames",
    ],
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

  async function handleSubmit(data: InspectionWizardInput) {
    setError(null);
    setLoading(true);
    console.log(data);

    const parsed = InspectionWizardSchema.safeParse(data);

    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
      setLoading(false);
      return;
    }

    try {
      console.log("parse", parsed.data);
      const validated = InspectionInsert.safeParse({
        hiveId,
        inspectionDate: new Date().toISOString().split("T")[0],
        ...parsed.data,
      });

      console.log("validate", validated);
      if (!validated.success) {
        setError(
          validated.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        );
        setLoading(false);
        return;
      }

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      if (!res.ok) {
        console.log(res);
        throw new Error(
          await getErrorMessage(res, "Failed to save inspection"),
        );
      }
      router.push(`hives/${hiveId}`);
      setLoading(false);
    } catch (err: unknown) {
      setError(String(err));
    }
  }

  const Step = steps[stepIndex];

  return (
    <div>
      {error && (
        <div className="mb-4 border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

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

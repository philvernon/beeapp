"use client";

import React, { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  InspectionWizardSchema,
  type InspectionWizardInput,
} from "@/lib/inspection-wizard-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { QueenFields } from "./groups/queen-fields";
import { ColonyFields } from "./groups/colony-fields";
import { HealthFields } from "./groups/health-fields";
import { WeatherFields } from "./groups/weather-fields";
import { NotesFields } from "./groups/notes-fields";
import { InspectionInsert } from "@/lib/schema";
import { getErrorMessage } from "@/lib/fetch";
import { getLocalDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Separator } from "@/components/ui/separator";

const wizardDefaultValues: InspectionWizardInput = {
  queenSeen: false,
  queenColour: null,
  queenCellsFound: null,
  queenCellsRemoved: false,
  eggsSeen: false,
  broodPatternOk: true,
  broodFrameCount: null,
  storeFrames: null,
  roomFrames: null,
  healthOk: true,
  chalkBroodSuspected: false,
  efbSuspected: false,
  afbSuspected: false,
  varroaLevel: null,
  varroaCount: null,
  temperamentScore: null,
  feedLitresLightSyrup: null,
  feedLitresHeavySyrup: null,
  supersChange: null,
  weatherTemperatureC: null,
  weatherCondition: null,
  notes: null,
};

function Previous({ previous }: { previous: () => void }) {
  return (
    <Button type="button" onClick={previous}>
      Previous
    </Button>
  );
}

function Next({ next }: { next: () => void }) {
  return (
    <Button type="button" onClick={next}>
      Next
    </Button>
  );
}

export function InspectionForm({
  hiveId,
  hiveName,
}: {
  hiveId: string;
  hiveName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    toast.add({
      type: "success",
      title: "Hive scanned",
      description: `Opening inspection for ${hiveName}`,
    });
  }, [hiveName]);

  const methods = useForm<InspectionWizardInput>({
    resolver: zodResolver(InspectionWizardSchema),
    defaultValues: wizardDefaultValues,
  });

  const stepLabels = ["Queen", "Brood", "Health", "Weather", "Notes"];

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
    try {
      const validated = InspectionInsert.safeParse({
        hiveId,
        inspectionDate: getLocalDate(),
        ...data,
      });

      if (!validated.success) {
        setError(
          validated.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        );
        return;
      }

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      if (!res.ok) {
        throw new Error(
          await getErrorMessage(res, "Failed to save inspection"),
        );
      }
      router.push(`/hives/${hiveId}`);
    } catch (err: unknown) {
      setError(String(err));
    }
  }

  const Step = steps[stepIndex];

  return (
    <div className="flex flex-col flex-1">
      {error && (
        <div className="mb-2 border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Breadcrumb className="sm:mb-2 shrink-0">
        <BreadcrumbList>
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <BreadcrumbItem>
                {i === stepIndex ? (
                  <BreadcrumbPage className="font-bold text-primary">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer text-muted-foreground"
                    onClick={() => setStepIndex(i)}
                  >
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {i < stepLabels.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Separator className="mt-1 mb-3 block sm:hidden" />
      <FormProvider {...methods}>
        <form
          id="new-inspection-form"
          onSubmit={methods.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col min-h-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Step />
          </div>

          <div className="shrink-0 py-2 flex justify-end">
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

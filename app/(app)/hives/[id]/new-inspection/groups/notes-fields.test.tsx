import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { NotesFields } from "./notes-fields";

const defaultValues: InspectionWizardValue = {
  eggsSeen: false,
  broodPatternOk: true,
  broodFrameCount: null,
  storeFrames: null,
  roomFrames: null,
  queenSeen: false,
  queenColour: null,
  queenCellsFound: null,
  queenCellsRemoved: false,
  healthOk: true,
  chalkBroodSuspected: false,
  efbSuspected: false,
  afbSuspected: false,
  varroaLevel: null,
  varroaCount: null,
  temperamentScore: null,
  feedLitresLightSyrup: null,
  feedLitresHeavySyrup: null,
  feedFondantAmount: null,
  supersChange: null,
  weatherTemperatureC: null,
  weatherCondition: null,
  notes: null,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<InspectionWizardValue>({ defaultValues });
  return <FormProvider {...form}>{children}</FormProvider>;
}

describe("NotesFields", () => {
  it("renders temperature number input", () => {
    render(
      <Wrapper>
        <NotesFields />
      </Wrapper>,
    );
    const label = screen.getByText(/Temperature/);
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });

  it("weather condition renders Cloudy/Sunny/Rain/Fair options", () => {
    render(
      <Wrapper>
        <NotesFields />
      </Wrapper>,
    );
    expect(screen.getByText("Condition")).toBeDefined();
  });

  it("notes renders a textarea", () => {
    render(
      <Wrapper>
        <NotesFields />
      </Wrapper>,
    );
    const label = screen.getByText("Notes");
    const field = label.closest('[data-slot="field"]');
    const textarea = field?.querySelector<HTMLTextAreaElement>("textarea");
    expect(textarea).not.toBeNull();
  });
});

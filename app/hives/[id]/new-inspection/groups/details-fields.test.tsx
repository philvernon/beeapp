import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { DetailsFields } from "./details-fields";

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
  supersChange: null,
  weatherTemperatureC: null,
  weatherCondition: null,
  notes: null,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  const form = useForm<InspectionWizardValue>({ defaultValues });
  return <FormProvider {...form}>{children}</FormProvider>;
}

describe("DetailsFields", () => {
  it("renders temperament score number input", () => {
    render(
      <Wrapper>
        <DetailsFields />
      </Wrapper>,
    );
    const label = screen.getByText("Temperament score");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });

  it("renders light syrup number input", () => {
    render(
      <Wrapper>
        <DetailsFields />
      </Wrapper>,
    );
    const label = screen.getByText("Light syrup (litres)");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });

  it("renders heavy syrup number input", () => {
    render(
      <Wrapper>
        <DetailsFields />
      </Wrapper>,
    );
    const label = screen.getByText("Heavy syrup (litres)");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });

  it("renders supers change number input", () => {
    render(
      <Wrapper>
        <DetailsFields />
      </Wrapper>,
    );
    const label = screen.getByText("Supers change");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });
});

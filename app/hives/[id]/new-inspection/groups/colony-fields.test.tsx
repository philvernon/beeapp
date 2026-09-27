import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { ColonyFields } from "./colony-fields";

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

describe("ColonyFields", () => {
  it("renders all five fields", () => {
    render(
      <Wrapper>
        <ColonyFields />
      </Wrapper>,
    );
    expect(screen.getByText("Eggs seen")).toBeDefined();
    expect(screen.getByText("Brood pattern OK")).toBeDefined();
    expect(screen.getByText("Brood frame count")).toBeDefined();
    expect(screen.getByText("Store frames")).toBeDefined();
    expect(screen.getByText("Room frames")).toBeDefined();
  });

  it("eggsSeen renders Yes/No radio options", () => {
    render(
      <Wrapper>
        <ColonyFields />
      </Wrapper>,
    );
    const field = screen
      .getByText("Eggs seen")
      .closest('[data-slot="field"]') as HTMLElement;
    expect(within(field).getByText("Yes")).toBeDefined();
    expect(within(field).getByText("No")).toBeDefined();
  });

  it("broodPatternOk renders Yes/No radio options", () => {
    render(
      <Wrapper>
        <ColonyFields />
      </Wrapper>,
    );
    const field = screen
      .getByText("Brood pattern OK")
      .closest('[data-slot="field"]') as HTMLElement;
    expect(within(field).getByText("Yes")).toBeDefined();
    expect(within(field).getByText("No")).toBeDefined();
  });

  it("broodFrameCount renders a number input", () => {
    render(
      <Wrapper>
        <ColonyFields />
      </Wrapper>,
    );
    const label = screen.getByText("Brood frame count");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });

  it("storeFrames renders a number input", () => {
    render(
      <Wrapper>
        <ColonyFields />
      </Wrapper>,
    );
    const label = screen.getByText("Store frames");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });

  it("roomFrames renders a number input", () => {
    render(
      <Wrapper>
        <ColonyFields />
      </Wrapper>,
    );
    const label = screen.getByText("Room frames");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });
});

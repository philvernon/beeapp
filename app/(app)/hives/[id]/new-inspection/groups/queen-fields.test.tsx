import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { QueenFields } from "./queen-fields";

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

function Wrapper({
  children,
  values,
}: {
  children: React.ReactNode;
  values?: Partial<InspectionWizardValue>;
}) {
  const form = useForm<InspectionWizardValue>({
    defaultValues: { ...defaultValues, ...values },
  });
  return <FormProvider {...form}>{children}</FormProvider>;
}

describe("QueenFields", () => {
  it('renders "Queen seen" Yes/No radio', () => {
    render(
      <Wrapper>
        <QueenFields />
      </Wrapper>,
    );
    expect(screen.getByText("Queen seen")).toBeDefined();
    const yesNoTexts = screen.getAllByText(/Yes|No/);
    expect(yesNoTexts.length).toBeGreaterThanOrEqual(2);
  });

  it("queen colour options are hidden when queenSeen is false", () => {
    render(
      <Wrapper>
        <QueenFields />
      </Wrapper>,
    );
    expect(screen.queryByText("Queen colour")).toBeNull();
  });

  it("queen colour options appear when queenSeen is true", () => {
    render(
      <Wrapper values={{ queenSeen: true }}>
        <QueenFields />
      </Wrapper>,
    );
    expect(screen.getByText("Queen colour")).toBeDefined();
  });

  it("queen cells found renders a number input", () => {
    render(
      <Wrapper>
        <QueenFields />
      </Wrapper>,
    );
    const label = screen.getByText("Cells found");
    const field = label.closest('[data-slot="field"]');
    const input = field?.querySelector<HTMLInputElement>(
      '[data-slot="number-input-value"]',
    );
    expect(input).not.toBeNull();
  });

  it("queen cells removed renders Yes/No radio", () => {
    render(
      <Wrapper>
        <QueenFields />
      </Wrapper>,
    );
    expect(screen.getByText("Queen cells removed")).toBeDefined();
    const yesNoTexts = screen.getAllByText(/Yes|No/);
    expect(yesNoTexts.length).toBeGreaterThanOrEqual(2);
  });
});

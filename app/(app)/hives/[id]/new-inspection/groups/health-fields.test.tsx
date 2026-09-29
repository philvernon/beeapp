import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { InspectionWizardValue } from "@/lib/inspection-wizard-schema";
import { HealthFields } from "./health-fields";

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

describe("HealthFields", () => {
  it('renders "Disease" Yes/No radio', () => {
    render(
      <Wrapper>
        <HealthFields />
      </Wrapper>,
    );
    expect(screen.getByText("Disease")).toBeDefined();
    // Should have at least Yes and No text visible
    const yesNoTexts = screen.getAllByText(/Yes|No/);
    expect(yesNoTexts.length).toBeGreaterThanOrEqual(2);
  });

  it("disease flags are hidden when healthOk is true", () => {
    render(
      <Wrapper>
        <HealthFields />
      </Wrapper>,
    );
    expect(screen.queryByText("Chalk brood suspected")).toBeNull();
    expect(screen.queryByText("EFB suspected")).toBeNull();
    expect(screen.queryByText("AFB suspected")).toBeNull();
  });

  it("disease flags appear when healthOk is false", () => {
    render(
      <Wrapper values={{ healthOk: false }}>
        <HealthFields />
      </Wrapper>,
    );
    expect(screen.getByText("Chalk brood suspected")).toBeDefined();
    expect(screen.getByText("EFB suspected")).toBeDefined();
    expect(screen.getByText("AFB suspected")).toBeDefined();
  });

  it("varroa level renders Low/Medium/High options", () => {
    render(
      <Wrapper>
        <HealthFields />
      </Wrapper>,
    );
    expect(screen.getByText("Varroa level")).toBeDefined();
    // Check that at least one of the varroa level labels is present
    const varroaOptions = screen.getAllByText(/Low|Medium|High/);
    expect(varroaOptions.length).toBeGreaterThan(0);
  });
});

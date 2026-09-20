"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/fetch";
import { InspectionInsert, queenColourLabels, varroaLevelLabels, weatherConditionLabels } from "@/lib/schema";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,

} from "@/components/ui/questionnaire";
import {
  InspectionWizardSchema,
  type InspectionWizardInput,
} from "@/lib/inspection-wizard-schema";

// ---------------------------------------------------------------------------
// Questionnaire item definitions — one per question.
// Conditional items are gated via `disabled` in the rendered tree.
// ---------------------------------------------------------------------------
type QueenSeenValue = InspectionWizardInput["queenSeen"]
type HealthOkValue = InspectionWizardInput["healthOk"]

// ---------------------------------------------------------------------------
// Label map
// ---------------------------------------------------------------------------

const LABELS: Record<string, string> = {
  queenSeen: "Queen seen this inspection?",
  queenColour: "Queen colour",
  queenCellsFound: "Queen cells found",
  queenCellsRemoved: "Queen cells removed?",
  eggsSeen: "Eggs seen?",
  broodPatternOk: "Brood pattern OK?",
  broodFrameCount: "Brood frame count",
  storeFrames: "Store frames (honey/pollen)",
  roomFrames: "Room frames (available space)",
  healthOk: "No disease signs?",
  chalkBroodSuspected: "Chalk brood suspected?",
  efbSuspected: "EFB suspected?",
  afbSuspected: "AFB suspected?",
  varroaLevel: "Varroa level",
  varroaCount: "Varroa count",
  temperamentScore: "Temperament score (1 = aggressive, 10 = docile)",
  feedLitresLightSyrup: "Light syrup (litres)",
  feedLitresHeavySyrup: "Heavy syrup (litres)",
  supersChange: "Supers change (positive = added, negative = removed)",
  weatherTemperatureC: "Weather temperature (°C)",
  weatherCondition: "Weather condition",
  notes: "Notes",
};

// ---------------------------------------------------------------------------
// Questions 1–7: Conditions (queen, brood)
// ---------------------------------------------------------------------------

function QueenSeenQuestion({ queenSeen, setQueenSeen }: { queenSeen: QueenSeenValue, setQueenSeen: React.Dispatch<React.SetStateAction<QueenSeenValue>> }) {

  return (
    <>
      <QuestionnaireItem name="queenSeen" required>
        <QuestionnaireTitle>{LABELS.queenSeen}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true" checked={queenSeen === true} onChange={() => { setQueenSeen(true) }}>
            <span className="font-medium">Yes</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false" checked={queenSeen === false} onChange={() => { setQueenSeen(false) }}>
            <span className="font-medium">No</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem >


      <QuestionnaireItem name="queenColour" disabled={!queenSeen}>
        <QuestionnaireTitle>{LABELS.queenColour}</QuestionnaireTitle>
        <QuestionnaireChoices>
          {Object.entries(queenColourLabels).map(([k, v]) => (
            <QuestionnaireChoice key={k} value={k}>
              <span className="font-medium">{v}</span>
              <span className="text-muted-foreground">({k})</span>
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="queenCellsFound">
        <QuestionnaireTitle>{LABELS.queenCellsFound}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.queenCellsFound}
          placeholder="—"
          type="number"
          min="0"
        />
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="queenCellsRemoved">
        <QuestionnaireTitle>{LABELS.queenCellsRemoved}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true">
            <span className="font-medium">Yes</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false">
            <span className="font-medium">No</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="eggsSeen" required>
        <QuestionnaireTitle>{LABELS.eggsSeen}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true">
            <span className="font-medium">Yes</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false">
            <span className="font-medium">No</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="broodPatternOk" required>
        <QuestionnaireTitle>{LABELS.broodPatternOk}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true">
            <span className="font-medium">OK</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false">
            <span className="font-medium">Not OK</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="broodFrameCount">
        <QuestionnaireTitle>{LABELS.broodFrameCount}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.broodFrameCount}
          placeholder="—"
          type="number"
          min="0"
        />
        <QuestionnaireError />
      </QuestionnaireItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Questions 8–9: Colony (stores & space)
// ---------------------------------------------------------------------------

function ColonyQuestions() {

  return (
    <>
      <QuestionnaireItem name="storeFrames">
        <QuestionnaireTitle>{LABELS.storeFrames}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.storeFrames}
          placeholder="—"
          type="number"
          min="0"
        />
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="roomFrames">
        <QuestionnaireTitle>{LABELS.roomFrames}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.roomFrames}
          placeholder="—"
          type="number"
          min="0"
        />
        <QuestionnaireError />
      </QuestionnaireItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Questions 10–15: Health & Varroa
// ---------------------------------------------------------------------------

function HealthQuestions({ healthOk, setHealthOk }: { healthOk: HealthOkValue, setHealthOk: React.Dispatch<React.SetStateAction<HealthOkValue>> }) {

  return (
    <>
      <QuestionnaireItem name="healthOk" required>
        <QuestionnaireTitle>{LABELS.healthOk}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true" checked={healthOk === true} onChange={() => setHealthOk(true)}>
            <span className="font-medium">Yes — no disease signs</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false" checked={healthOk === false} onChange={() => setHealthOk(false)}>
            <span className="font-medium">No — disease flags present</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="chalkBroodSuspected" disabled={healthOk !== false}>
        <QuestionnaireTitle>{LABELS.chalkBroodSuspected}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true">
            <span className="font-medium">Yes</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false">
            <span className="font-medium">No</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="efbSuspected" disabled={healthOk !== false}>
        <QuestionnaireTitle>{LABELS.efbSuspected}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true">
            <span className="font-medium">Yes</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false">
            <span className="font-medium">No</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="afbSuspected" disabled={healthOk !== false}>
        <QuestionnaireTitle>{LABELS.afbSuspected}</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="true">
            <span className="font-medium">Yes</span>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="false">
            <span className="font-medium">No</span>
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="varroaLevel" required>
        <QuestionnaireTitle>{LABELS.varroaLevel}</QuestionnaireTitle>
        <QuestionnaireChoices>
          {Object.entries(varroaLevelLabels).map(([k, v]) => (
            <QuestionnaireChoice key={k} value={k}>
              <span className="font-medium">{v}</span>
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="varroaCount">
        <QuestionnaireTitle>{LABELS.varroaCount}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.varroaCount}
          placeholder="—"
          type="number"
          min="0"
        />
        <QuestionnaireError />
      </QuestionnaireItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Questions 16–19: Temperament & Feeding
// ---------------------------------------------------------------------------

function TemperamentQuestions() {

  return (
    <>
      <QuestionnaireItem name="temperamentScore" required>
        <QuestionnaireTitle>{LABELS.temperamentScore}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.temperamentScore}
          placeholder="—"
          type="number"
          min="1"
          max="10"
        />
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="feedLitresLightSyrup">
        <QuestionnaireTitle>{LABELS.feedLitresLightSyrup}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.feedLitresLightSyrup}
          placeholder="—"
          type="number"
          step="0.25"
          min="0"
        />
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="feedLitresHeavySyrup">
        <QuestionnaireTitle>{LABELS.feedLitresHeavySyrup}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.feedLitresHeavySyrup}
          placeholder="—"
          type="number"
          step="0.25"
          min="0"
        />
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="supersChange">
        <QuestionnaireTitle>{LABELS.supersChange}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.supersChange}
          placeholder="—"
          type="number"
          step="0.5"
        />
        <QuestionnaireError />
      </QuestionnaireItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Questions 20–22: Review (weather + notes)
// ---------------------------------------------------------------------------

function ReviewQuestions() {

  return (
    <>
      <QuestionnaireItem name="weatherTemperatureC" required>
        <QuestionnaireTitle>{LABELS.weatherTemperatureC}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.weatherTemperatureC}
          placeholder="—"
          type="number"
          step="0.1"
        />
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="weatherCondition" required>
        <QuestionnaireTitle>{LABELS.weatherCondition}</QuestionnaireTitle>
        <QuestionnaireChoices>
          {Object.entries(weatherConditionLabels).map(([k, v]) => (
            <QuestionnaireChoice key={k} value={k}>
              <span className="font-medium">{v}</span>
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>

      <QuestionnaireItem name="notes">
        <QuestionnaireTitle>{LABELS.notes}</QuestionnaireTitle>
        <QuestionnaireInput
          aria-label={LABELS.notes}
          placeholder="Any additional observations…"
        />
        <QuestionnaireError />
      </QuestionnaireItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main form component
// ---------------------------------------------------------------------------

interface InspectionFormProps {
  hiveId: string;
  onSuccess?: () => void;
}

export function InspectionForm({ hiveId, onSuccess }: InspectionFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [queenSeen, setQueenSeen] =
    React.useState<QueenSeenValue>(false)

  const [healthOk, setHealthOk] =
    React.useState<HealthOkValue>(true)

  const QUESTIONNAIRE_ITEMS = [
    { name: "queenSeen", required: true },
    { name: "queenColour", disabled: !queenSeen },
    { name: "queenCellsFound" },
    { name: "queenCellsRemoved" },
    { name: "eggsSeen", required: true },
    { name: "broodPatternOk", required: true },
    { name: "broodFrameCount" },
    { name: "storeFrames" },
    { name: "roomFrames" },
    { name: "healthOk", required: true },
    { name: "chalkBroodSuspected", disabled: healthOk },
    { name: "efbSuspected", disabled: healthOk },
    { name: "afbSuspected", disabled: healthOk },
    { name: "varroaLevel", required: true },
    { name: "varroaCount" },
    { name: "temperamentScore", required: true },
    { name: "feedLitresLightSyrup" },
    { name: "feedLitresHeavySyrup" },
    { name: "supersChange" },
    { name: "weatherTemperatureC", required: true },
    { name: "weatherCondition", required: true },
    { name: "notes" },
  ] as const;



  const formSubmit = React.useCallback(
    async (ev: React.SyntheticEvent<HTMLFormElement>) => {
      ev.preventDefault();
      setError(null);
      setLoading(true);

      const raw = Object.fromEntries(
        new FormData(ev.currentTarget)
      )

      const parsed = InspectionWizardSchema.safeParse(raw);

      if (!parsed.success) {
        setError(
          parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")
        );
        return;
      }

      try {
        const formBody = {
          hiveId,
          inspectionDate: new Date().toISOString().split("T")[0],
          ...parsed.data,
        } as Record<string, unknown>;

        const validated = InspectionInsert.safeParse(formBody);
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
          throw new Error(await getErrorMessage(res, "Failed to save inspection"));
        }

        onSuccess?.();
        router.push(`/hives/${hiveId}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [hiveId, onSuccess, router],
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-4 border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Questionnaire
        items={QUESTIONNAIRE_ITEMS}
        defaultItem="queenSeen"
        onSubmit={formSubmit}
      >
        {healthOk ? "true" : "false"}
        <QuestionnaireProgress />

        <QueenSeenQuestion
          queenSeen={queenSeen}
          setQueenSeen={setQueenSeen}

        />
        <ColonyQuestions />
        <HealthQuestions
          healthOk={healthOk}
          setHealthOk={setHealthOk}

        />
        <TemperamentQuestions />
        <ReviewQuestions />

        <QuestionnaireActions className="w-full">
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit>
            {loading ? "Saving…" : "Save Inspection"}
          </QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
    </div>
  );
}

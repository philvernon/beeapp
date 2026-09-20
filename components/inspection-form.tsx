"use client";

import * as React from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { safeJsonFetch, getErrorMessage } from "@/lib/fetch";
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
import { InspectionWizardSchema, type InspectionWizardInput } from "@/app/hives/[id]/new-inspection/inspection-wizard-schema";

// ---------------------------------------------------------------------------
// Questionnaire item definitions — one per question.
// Conditional items are gated via `disabled` in the rendered tree.
// ---------------------------------------------------------------------------

const QUESTIONNAIRE_ITEMS = [
	{ name: "queenSeen", required: true },
	{ name: "queenColour" },
	{ name: "queenCellsFound" },
	{ name: "queenCellsRemoved" },
	{ name: "eggsSeen", required: true },
	{ name: "broodPatternOk", required: true },
	{ name: "broodFrameCount" },
	{ name: "storeFrames" },
	{ name: "roomFrames" },
	{ name: "healthOk", required: true },
	{ name: "chalkBroodSuspected" },
	{ name: "efbSuspected" },
	{ name: "afbSuspected" },
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
// Helpers — read RHF state for conditional logic
// ---------------------------------------------------------------------------

function useWatchBoolean(name: keyof InspectionWizardInput): boolean {
	const { watch } = useFormContext<InspectionWizardInput>();
	return Boolean(watch(name));
}

// ---------------------------------------------------------------------------
// Questions 1–7: Conditions (queen, brood)
// ---------------------------------------------------------------------------

function QueenSeenQuestion() {
	const { register, setValue } = useFormContext<InspectionWizardInput>();
	const queenSeen = useWatchBoolean("queenSeen");

	// Sync Questionnaire's boolean choice ("true"/"false") → RHF (boolean)
	const syncBool = (name: keyof InspectionWizardInput, raw: string | null) => {
		setValue(name, raw === "true", { shouldValidate: true });
	};

	return (
		<>
			<QuestionnaireItem name="queenSeen" required>
				<QuestionnaireTitle>{LABELS.queenSeen}</QuestionnaireTitle>
				<QuestionnaireChoices>
					<QuestionnaireChoice
						value="true"
						checked={queenSeen === true}
						onChange={() => syncBool("queenSeen", "true")}
					>
						<span className="font-medium">Yes</span>
					</QuestionnaireChoice>
					<QuestionnaireChoice
						value="false"
						checked={queenSeen === false}
						onChange={() => syncBool("queenSeen", "false")}
					>
						<span className="font-medium">No</span>
					</QuestionnaireChoice>
				</QuestionnaireChoices>
				<QuestionnaireError />
			</QuestionnaireItem>

			{queenSeen && (
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
			)}

			<QuestionnaireItem name="queenCellsFound">
				<QuestionnaireTitle>{LABELS.queenCellsFound}</QuestionnaireTitle>
				<QuestionnaireInput
					aria-label={LABELS.queenCellsFound}
					placeholder="—"
					type="number"
					min="0"
					{...register("queenCellsFound", { valueAsNumber: true })}
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
					{...register("broodFrameCount", { valueAsNumber: true })}
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
	const { register } = useFormContext<InspectionWizardInput>();

	return (
		<>
			<QuestionnaireItem name="storeFrames">
				<QuestionnaireTitle>{LABELS.storeFrames}</QuestionnaireTitle>
				<QuestionnaireInput
					aria-label={LABELS.storeFrames}
					placeholder="—"
					type="number"
					min="0"
					{...register("storeFrames", { valueAsNumber: true })}
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
					{...register("roomFrames", { valueAsNumber: true })}
				/>
				<QuestionnaireError />
			</QuestionnaireItem>
		</>
	);
}

// ---------------------------------------------------------------------------
// Questions 10–15: Health & Varroa
// ---------------------------------------------------------------------------

function HealthQuestions() {
	const { register, watch } = useFormContext<InspectionWizardInput>();
	const healthOk = watch("healthOk");

	return (
		<>
			<QuestionnaireItem name="healthOk" required>
				<QuestionnaireTitle>{LABELS.healthOk}</QuestionnaireTitle>
				<QuestionnaireChoices>
					<QuestionnaireChoice value="true">
						<span className="font-medium">Yes — no disease signs</span>
					</QuestionnaireChoice>
					<QuestionnaireChoice value="false">
						<span className="font-medium">No — disease flags present</span>
					</QuestionnaireChoice>
				</QuestionnaireChoices>
				<QuestionnaireError />
			</QuestionnaireItem>

			{healthOk === false && (
				<>
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
				</>
			)}

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
					{...register("varroaCount", { valueAsNumber: true })}
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
	const { register } = useFormContext<InspectionWizardInput>();

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
					{...register("temperamentScore", { valueAsNumber: true })}
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
					{...register("feedLitresLightSyrup", { valueAsNumber: true })}
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
					{...register("feedLitresHeavySyrup", { valueAsNumber: true })}
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
					{...register("supersChange", { valueAsNumber: true })}
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
	const { register } = useFormContext<InspectionWizardInput>();

	return (
		<>
			<QuestionnaireItem name="weatherTemperatureC" required>
				<QuestionnaireTitle>{LABELS.weatherTemperatureC}</QuestionnaireTitle>
				<QuestionnaireInput
					aria-label={LABELS.weatherTemperatureC}
					placeholder="—"
					type="number"
					step="0.1"
					{...register("weatherTemperatureC", { valueAsNumber: true })}
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
					{...register("notes")}
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
	const [_hiveName, setHiveName] = React.useState("");

	// Load hive name on mount (used by parent page for header)
	React.useEffect(() => {
		safeJsonFetch(`/api/hives/${hiveId}`).then((result) => {
			if (!result.error) {
				const data = result.data as Record<string, unknown> | null;
				if (data?.name) setHiveName(data.name as string);
			}
		});
	}, [hiveId]);

	const methods = useForm<InspectionWizardInput>({
		resolver: zodResolver(InspectionWizardSchema),
		defaultValues: {
			queenSeen: false,
			queenCellsRemoved: false,
			broodPatternOk: true,
			healthOk: true,
			chalkBroodSuspected: false,
			efbSuspected: false,
			afbSuspected: false,
		},
		shouldUnregister: false,
		mode: "onTouched",
	});

	const formSubmit = React.useCallback(
		async (ev: React.FormEvent<HTMLFormElement>) => {
			ev.preventDefault();
			setError(null);
			setLoading(true);

			const values = methods.getValues();

			const body = {
				hiveId,
				inspectionDate: new Date().toISOString().split("T")[0],
				queenSeen: values.queenSeen ?? false,
				queenColour: values.queenColour || null,
				queenCellsFound: values.queenCellsFound === "" ? null : values.queenCellsFound,
				queenCellsRemoved: values.queenCellsRemoved ?? false,
				eggsSeen: values.eggsSeen ?? false,
				broodPatternOk: values.broodPatternOk ?? true,
				broodFrameCount: values.broodFrameCount === "" ? null : values.broodFrameCount,
				storeFrames: values.storeFrames === "" ? null : values.storeFrames,
				roomFrames: values.roomFrames === "" ? null : values.roomFrames,
				healthOk: values.healthOk ?? true,
				chalkBroodSuspected: values.chalkBroodSuspected ?? false,
				efbSuspected: values.efbSuspected ?? false,
				afbSuspected: values.afbSuspected ?? false,
				varroaLevel: values.varroaLevel || null,
				varroaCount: values.varroaCount === "" ? null : values.varroaCount,
				temperamentScore: values.temperamentScore === "" ? null : values.temperamentScore,
				feedLitresLightSyrup: values.feedLitresLightSyrup || null,
				feedLitresHeavySyrup: values.feedLitresHeavySyrup || null,
				supersChange: values.supersChange || null,
				weatherTemperatureC: values.weatherTemperatureC || null,
				weatherCondition: values.weatherCondition || null,
				notes: values.notes || undefined,
			};

			try {
				const validated = InspectionInsert.safeParse(body);
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
		[methods, hiveId, onSuccess, router],
	);

	return (
		<FormProvider {...methods}>
			<form onSubmit={formSubmit} className="space-y-6" noValidate>
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
					<QuestionnaireProgress />

					<QueenSeenQuestion />
					<ColonyQuestions />
					<HealthQuestions />
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
			</form>
		</FormProvider>
	);
}

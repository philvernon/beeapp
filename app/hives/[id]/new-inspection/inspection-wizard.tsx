"use client";

import { useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	InspectionWizardSchema,
	type InspectionWizardInput,
} from "./inspection-wizard-schema";
import {
	queenColourLabels,
	varroaLevelLabels,
	weatherConditionLabels,
} from "@/lib/schema";

// ---------------------------------------------------------------------------
// Step configuration — stable IDs, display labels, and content components.
// Add or reorder steps here; the wizard adapts automatically.
// ---------------------------------------------------------------------------

const STEPS = [
	{ id: "conditions", label: "Conditions" },
	{ id: "colony", label: "Colony" },
	{ id: "stores-actions", label: "Stores & Actions" },
	{ id: "health", label: "Health" },
	{ id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Fields that belong to each step — used for per-step validation on Next.
const STEP_FIELDS: Record<StepId, (keyof InspectionWizardInput)[]> = {
	conditions: [
		"queenSeen",
		"queenColour",
		"queenCellsFound",
		"queenCellsRemoved",
		"eggsSeen",
		"broodPatternOk",
		"broodFrameCount",
	],
	colony: ["storeFrames", "roomFrames"],
	"stores-actions": [
		"healthOk",
		"chalkBroodSuspected",
		"efbSuspected",
		"afbSuspected",
		"varroaLevel",
		"varroaCount",
	],
	health: ["temperamentScore", "feedLitresLightSyrup", "feedLitresHeavySyrup", "supersChange"],
	review: ["weatherTemperatureC", "weatherCondition", "notes"],
};

// ---------------------------------------------------------------------------
// Shared UI primitives (kept local to avoid cross-file imports)
// ---------------------------------------------------------------------------

const inputClass =
	"w-full border border-input bg-transparent px-2.5 py-1.5 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "block text-sm font-medium text-foreground mb-1";
const fieldsetClass = "border border-border p-4 space-y-3 rounded-none bg-card";

function CheckboxField({
	id,
	label,
	...props
}: React.ComponentProps<"input"> & { label: string }) {
	return (
		<label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
			<input id={id} type="checkbox" className={cn("h-4 w-4 border-input accent-primary focus:ring-ring", props.className)} {...props} />
			<span className="text-sm text-foreground">{label}</span>
		</label>
	);
}

function cn(...classes: (string | undefined | false | null)[]) {
	return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Step content components
// ---------------------------------------------------------------------------

function ConditionsStep() {
	const { register, watch } = useFormContext<InspectionWizardInput>();
	const queenSeen = watch("queenSeen");

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Conditions</h2>

			{/* Queen */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					👑 Queen
				</legend>
				<CheckboxField id="wizard-queenSeen" label="Queen seen this inspection" {...register("queenSeen")} />
				{queenSeen && (
					<div className="ml-6 space-y-3">
						<div>
							<label htmlFor="wizard-queenColour" className={labelClass}>Queen Colour</label>
							<select
								{...register("queenColour")}
								id="wizard-queenColour"
								className={inputClass}
							>
								<option value="">Select…</option>
								{Object.entries(queenColourLabels).map(([k, v]) => (
									<option key={k} value={k}>
										{v} ({k})
									</option>
								))}
							</select>
						</div>
					</div>
				)}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="wizard-queenCellsFound" className={labelClass}>Queen Cells Found</label>
						<input
							id="wizard-queenCellsFound"
							type="number"
							min="0"
							{...register("queenCellsFound", { valueAsNumber: true })}
							placeholder="—"
							className={inputClass}
						/>
					</div>
					<div className="flex items-center pt-6">
						<CheckboxField
							id="wizard-queenCellsRemoved"
							label="Cells removed"
							{...register("queenCellsRemoved")}
						/>
					</div>
				</div>
			</fieldset>

			{/* Brood */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					🐝 Brood
				</legend>
				<div className="flex items-center gap-4">
					<CheckboxField id="wizard-eggsSeen" label="Eggs seen" {...register("eggsSeen")} />
					<CheckboxField id="wizard-broodPatternOk" label="Brood pattern OK" {...register("broodPatternOk")} />
				</div>
				<div>
					<label htmlFor="wizard-broodFrameCount" className={labelClass}>Brood Frame Count</label>
					<input
						id="wizard-broodFrameCount"
						type="number"
						min="0"
						{...register("broodFrameCount", { valueAsNumber: true })}
						placeholder="—"
						className={inputClass}
					/>
				</div>
			</fieldset>
		</div>
	);
}

function ColonyStep() {
	const { register } = useFormContext<InspectionWizardInput>();

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Colony</h2>
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					🍯 Stores & Space
				</legend>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="wizard-storeFrames" className={labelClass}>Store Frames (honey/pollen)</label>
						<input
							id="wizard-storeFrames"
							type="number"
							min="0"
							{...register("storeFrames", { valueAsNumber: true })}
							placeholder="—"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="wizard-roomFrames" className={labelClass}>Room Frames (available space)</label>
						<input
							id="wizard-roomFrames"
							type="number"
							min="0"
							{...register("roomFrames", { valueAsNumber: true })}
							placeholder="—"
							className={inputClass}
						/>
					</div>
				</div>
			</fieldset>
		</div>
	);
}

function StoresActionsStep() {
	const { register, watch } = useFormContext<InspectionWizardInput>();
	const healthOk = watch("healthOk");

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Stores & Actions</h2>

			{/* Health */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					🏥 Health
				</legend>
				<CheckboxField id="wizard-healthOk" label="No disease signs" {...register("healthOk")} />
				{!healthOk && (
					<div className="ml-6 space-y-2">
						<p className="text-xs text-muted-foreground mb-1">Disease flags:</p>
						<div className="flex gap-4">
							<CheckboxField id="wizard-chalkBrood" label="Chalk Brood" {...register("chalkBroodSuspected")} />
							<CheckboxField id="wizard-efb" label="EFB" {...register("efbSuspected")} />
							<CheckboxField id="wizard-afb" label="AFB" {...register("afbSuspected")} />
						</div>
					</div>
				)}
			</fieldset>

			{/* Varroa */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					🔬 Varroa
				</legend>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="wizard-varroaLevel" className={labelClass}>Level</label>
						<select id="wizard-varroaLevel" {...register("varroaLevel")} className={inputClass}>
							<option value="">Select…</option>
							{Object.entries(varroaLevelLabels).map(([k, v]) => (
								<option key={k} value={k}>
									{v}
								</option>
							))}
						</select>
					</div>
					<div>
						<label htmlFor="wizard-varroaCount" className={labelClass}>Count (optional)</label>
						<input
							id="wizard-varroaCount"
							type="number"
							min="0"
							{...register("varroaCount", { valueAsNumber: true })}
							placeholder="—"
							className={inputClass}
						/>
					</div>
				</div>
			</fieldset>
		</div>
	);
}

function HealthStep() {
	const { register } = useFormContext<InspectionWizardInput>();

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Health</h2>

			{/* Temperament */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					🌡️ Temperament
				</legend>
				<div>
					<label htmlFor="wizard-temperamentScore" className={labelClass}>
						Docility Score (1 = aggressive, 10 = docile)
					</label>
					<input
						id="wizard-temperamentScore"
						type="number"
						min="1"
						max="10"
						{...register("temperamentScore", { valueAsNumber: true })}
						placeholder="—"
						className={inputClass}
					/>
				</div>
			</fieldset>

			{/* Feed */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					🍯 Feeding
				</legend>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="wizard-feedLitresLightSyrup" className={labelClass}>Light Syrup (litres)</label>
						<input
							id="wizard-feedLitresLightSyrup"
							type="number"
							step="0.25"
							min="0"
							{...register("feedLitresLightSyrup", { valueAsNumber: true })}
							placeholder="—"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="wizard-feedLitresHeavySyrup" className={labelClass}>Heavy Syrup (litres)</label>
						<input
							id="wizard-feedLitresHeavySyrup"
							type="number"
							step="0.25"
							min="0"
							{...register("feedLitresHeavySyrup", { valueAsNumber: true })}
							placeholder="—"
							className={inputClass}
						/>
					</div>
				</div>
			</fieldset>

			{/* Supers */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					📦 Supers
				</legend>
				<div>
					<label htmlFor="wizard-supersChange" className={labelClass}>Supers Change (positive = added, negative = removed)</label>
					<input
						id="wizard-supersChange"
						type="number"
						step="0.5"
						{...register("supersChange", { valueAsNumber: true })}
						placeholder="—"
						className={inputClass}
					/>
				</div>
			</fieldset>
		</div>
	);
}

function ReviewStep() {
	const { register, getValues } = useFormContext<InspectionWizardInput>();

	// getValues() returns the internal form state regardless of registration.
	// For unregistered fields it may return {} at runtime — coerce to undefined.
	const gv = <K extends keyof InspectionWizardInput>(key: K): InspectionWizardInput[K] | undefined => {
		const v = getValues(key);
		if (typeof v === "object" && v !== null) return undefined;
		return v as InspectionWizardInput[K] | undefined;
	};

	const weatherCondition = gv("weatherCondition") as string | null | undefined;
	const queenSeen = gv("queenSeen") ?? false;
	const queenColour = gv("queenColour") as string | null | undefined;
	const eggsSeen = gv("eggsSeen") ?? false;
	const broodPatternOk = gv("broodPatternOk") ?? true;
	const storeFrames = gv("storeFrames") as number | null | undefined;
	const roomFrames = gv("roomFrames") as number | null | undefined;
	const healthOk = gv("healthOk") ?? true;
	const varroaLevel = gv("varroaLevel") as string | null | undefined;
	const temperamentScore = gv("temperamentScore") as number | null | undefined;
	const weatherTemperatureC = gv("weatherTemperatureC") as number | null | undefined;

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Review</h2>

			{/* Weather */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					🌤️ Weather
				</legend>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="wizard-weatherTemperatureC" className={labelClass}>Temperature (°C)</label>
						<input
							id="wizard-weatherTemperatureC"
							type="number"
							step="0.1"
							{...register("weatherTemperatureC", { valueAsNumber: true })}
							placeholder="—"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="wizard-weatherCondition" className={labelClass}>Condition</label>
						<select id="wizard-weatherCondition" {...register("weatherCondition")} className={inputClass}>
							<option value="">Select…</option>
							{Object.entries(weatherConditionLabels).map(([k, v]) => (
								<option key={k} value={k}>
									{v}
								</option>
							))}
						</select>
					</div>
				</div>
			</fieldset>

			{/* Notes */}
			<div>
				<label htmlFor="wizard-notes" className={labelClass}>
					Notes
				</label>
				<textarea
					id="wizard-notes"
					{...register("notes")}
					rows={3}
					className={inputClass}
					placeholder="Any additional observations…"
				/>
			</div>

			{/* Summary preview */}
			<fieldset className={fieldsetClass}>
				<legend className="text-sm font-semibold text-foreground mb-2">
					📋 Summary Preview
				</legend>
				<div className="text-xs text-muted-foreground space-y-1">
					<p>Queen: {queenSeen ? "Seen" : "Not seen"}{queenColour ? ` (${queenColour})` : ""}</p>
					<p>Eggs: {eggsSeen ? "Yes" : "No"} | Brood pattern: {broodPatternOk ? "OK" : "Not OK"}</p>
					<p>Store frames: {storeFrames ?? "—"} | Room frames: {roomFrames ?? "—"}</p>
					<p>Health: {healthOk ? "No disease signs" : "Disease flags present"}</p>
					<p>Varroa: {varroaLevel || "—"}</p>
					<p>Temperament: {temperamentScore ?? "—"}</p>
					<p>Weather: {weatherTemperatureC ?? "—"}°C, {weatherConditionLabels[weatherCondition as keyof typeof weatherConditionLabels] || weatherCondition || "—"}</p>
				</div>
			</fieldset>
		</div>
	);
}

const STEP_COMPONENTS: Record<StepId, React.ComponentType> = {
	conditions: ConditionsStep,
	colony: ColonyStep,
	"stores-actions": StoresActionsStep,
	health: HealthStep,
	review: ReviewStep,
};

// ---------------------------------------------------------------------------
// InspectionWizard — owns the single RHF instance, step index, and navigation.
// ---------------------------------------------------------------------------

export function InspectionWizard() {
	const [stepIndex, setStepIndex] = useState(0);
	const currentStep = STEPS[stepIndex];
	const CurrentStepComponent = STEP_COMPONENTS[currentStep.id as StepId];

	// shouldUnregister: false keeps field values when steps unmount/remount.
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
		mode: "onSubmit",
	});

	function handleNext() {
		const fields = STEP_FIELDS[currentStep.id as StepId];

		methods.trigger(fields).then((valid) => {
			if (!valid) return;
			if (stepIndex < STEPS.length - 1) {
				setStepIndex(stepIndex + 1);
			}
		});
	}

	function handlePrevious() {
		if (stepIndex > 0) {
			setStepIndex(stepIndex - 1);
		}
	}

	const isFirstStep = stepIndex === 0;
	const isLastStep = stepIndex === STEPS.length - 1;

	return (
		<FormProvider {...methods}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					// No-op: submission is deferred.
				}}
				noValidate
			>
				{/* Accessible step navigation */}
				<nav aria-label="Inspection wizard steps" className="mb-6">
					<ol className="flex items-center gap-2">
						{STEPS.map((step, i) => (
							<li key={step.id}>
								<span
									className={`text-sm ${
										i === stepIndex
											? "font-semibold text-accent"
											: "text-muted-foreground"
									}`}
									aria-current={i === stepIndex ? "step" : undefined}
								>
									{step.label}
								</span>
								{i < STEPS.length - 1 && (
									<span className="mx-2 text-muted-foreground">→</span>
								)}
							</li>
						))}
					</ol>
				</nav>

				{/* Current step heading */}
				<h1 className="text-xl font-bold mb-4">
					Step {stepIndex + 1}: {currentStep.label}
				</h1>

				{/* Step content */}
				<div className="mb-6">
					<CurrentStepComponent />
				</div>

				{/* Navigation buttons */}
				<div className="flex gap-3">
					<button
						type="button"
						onClick={handlePrevious}
						disabled={isFirstStep}
						className="px-4 py-2 text-sm border rounded disabled:opacity-50"
					>
						← Previous
					</button>

					{!isLastStep && (
						<button
							type="button"
							onClick={handleNext}
							className="px-4 py-2 text-sm bg-accent text-white rounded"
						>
							Next →
						</button>
					)}
				</div>
			</form>
		</FormProvider>
	);
}

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
// Step content components
// ---------------------------------------------------------------------------

function ConditionsStep() {
	const { register, watch } = useFormContext<InspectionWizardInput>();
	const queenSeen = watch("queenSeen");

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Conditions</h2>

			{/* Queen */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">👑 Queen</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Checkbox
						id="wizard-queenSeen"
						checked={queenSeen}
						onCheckedChange={(c) => register("queenSeen").onChange({ target: { value: !!c, name: "queenSeen" } })}
					/>
					<label htmlFor="wizard-queenSeen" className="text-sm text-foreground cursor-pointer">Queen seen this inspection</label>

					{queenSeen && (
						<div className="ml-6 space-y-3">
							<div>
								<label htmlFor="wizard-queenColour" className="block text-sm font-medium text-foreground mb-1">Queen Colour</label>
								<Select onValueChange={(v) => register("queenColour").onChange({ target: { value: v, name: "queenColour" } })}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select colour…" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(queenColourLabels).map(([k, v]) => (
											<SelectItem key={k} value={k}>{v} ({k})</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="wizard-queenCellsFound" className="block text-sm font-medium text-foreground mb-1">Queen Cells Found</label>
							<Input
								id="wizard-queenCellsFound"
								type="number"
								min="0"
								{...register("queenCellsFound", { valueAsNumber: true })}
								placeholder="—"
							/>
						</div>
						<div className="flex items-center pt-6">
							<Checkbox
								id="wizard-queenCellsRemoved"
								checked={watch("queenCellsRemoved")}
								onCheckedChange={(c) => register("queenCellsRemoved").onChange({ target: { value: !!c, name: "queenCellsRemoved" } })}
							/>
							<label htmlFor="wizard-queenCellsRemoved" className="text-sm text-foreground ml-2 cursor-pointer">Cells removed</label>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Brood */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">🐝 Brood</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-4">
						<Checkbox
							id="wizard-eggsSeen"
							checked={watch("eggsSeen")}
							onCheckedChange={(c) => register("eggsSeen").onChange({ target: { value: !!c, name: "eggsSeen" } })}
						/>
						<label htmlFor="wizard-eggsSeen" className="text-sm text-foreground cursor-pointer">Eggs seen</label>

						<Checkbox
							id="wizard-broodPatternOk"
							checked={watch("broodPatternOk")}
							onCheckedChange={(c) => register("broodPatternOk").onChange({ target: { value: !!c, name: "broodPatternOk" } })}
						/>
						<label htmlFor="wizard-broodPatternOk" className="text-sm text-foreground cursor-pointer">Brood pattern OK</label>
					</div>
					<div>
						<label htmlFor="wizard-broodFrameCount" className="block text-sm font-medium text-foreground mb-1">Brood Frame Count</label>
						<Input
							id="wizard-broodFrameCount"
							type="number"
							min="0"
							{...register("broodFrameCount", { valueAsNumber: true })}
							placeholder="—"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ColonyStep() {
	const { register } = useFormContext<InspectionWizardInput>();

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Colony</h2>
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">🍯 Stores & Space</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="wizard-storeFrames" className="block text-sm font-medium text-foreground mb-1">Store Frames (honey/pollen)</label>
							<Input
								id="wizard-storeFrames"
								type="number"
								min="0"
								{...register("storeFrames", { valueAsNumber: true })}
								placeholder="—"
							/>
						</div>
						<div>
							<label htmlFor="wizard-roomFrames" className="block text-sm font-medium text-foreground mb-1">Room Frames (available space)</label>
							<Input
								id="wizard-roomFrames"
								type="number"
								min="0"
								{...register("roomFrames", { valueAsNumber: true })}
								placeholder="—"
							/>
						</div>
					</div>
				</CardContent>
			</Card>
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
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">🏥 Health</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Checkbox
						id="wizard-healthOk"
						checked={watch("healthOk")}
						onCheckedChange={(c) => register("healthOk").onChange({ target: { value: !!c, name: "healthOk" } })}
					/>
					<label htmlFor="wizard-healthOk" className="text-sm text-foreground cursor-pointer">No disease signs</label>

					{healthOk === false && (
						<div className="ml-6 space-y-2">
							<p className="text-xs text-muted-foreground mb-1">Disease flags:</p>
							<div className="flex gap-4">
								<Checkbox
									id="wizard-chalkBrood"
									checked={watch("chalkBroodSuspected")}
									onCheckedChange={(c) => register("chalkBroodSuspected").onChange({ target: { value: !!c, name: "chalkBroodSuspected" } })}
								/>
								<label htmlFor="wizard-chalkBrood" className="text-sm text-foreground cursor-pointer">Chalk Brood</label>

								<Checkbox
									id="wizard-efb"
									checked={watch("efbSuspected")}
									onCheckedChange={(c) => register("efbSuspected").onChange({ target: { value: !!c, name: "efbSuspected" } })}
								/>
								<label htmlFor="wizard-efb" className="text-sm text-foreground cursor-pointer">EFB</label>

								<Checkbox
									id="wizard-afb"
									checked={watch("afbSuspected")}
									onCheckedChange={(c) => register("afbSuspected").onChange({ target: { value: !!c, name: "afbSuspected" } })}
								/>
								<label htmlFor="wizard-afb" className="text-sm text-foreground cursor-pointer">AFB</label>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Varroa */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">🔬 Varroa</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="wizard-varroaLevel" className="block text-sm font-medium text-foreground mb-1">Level</label>
							<Select onValueChange={(v) => register("varroaLevel").onChange({ target: { value: v, name: "varroaLevel" } })}>
								<SelectTrigger>
									<SelectValue placeholder="Select…" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(varroaLevelLabels).map(([k, v]) => (
										<SelectItem key={k} value={k}>{v}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<label htmlFor="wizard-varroaCount" className="block text-sm font-medium text-foreground mb-1">Count (optional)</label>
							<Input
								id="wizard-varroaCount"
								type="number"
								min="0"
								{...register("varroaCount", { valueAsNumber: true })}
								placeholder="—"
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function HealthStep() {
	const { register } = useFormContext<InspectionWizardInput>();

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold mb-4">Health</h2>

			{/* Temperament */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">🌡️ Temperament</CardTitle>
				</CardHeader>
				<CardContent>
					<div>
						<label htmlFor="wizard-temperamentScore" className="block text-sm font-medium text-foreground mb-1">
							Docility Score (1 = aggressive, 10 = docile)
						</label>
						<Input
							id="wizard-temperamentScore"
							type="number"
							min="1"
							max="10"
							{...register("temperamentScore", { valueAsNumber: true })}
							placeholder="—"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Feed */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">🍯 Feeding</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="wizard-feedLitresLightSyrup" className="block text-sm font-medium text-foreground mb-1">Light Syrup (litres)</label>
							<Input
								id="wizard-feedLitresLightSyrup"
								type="number"
								step="0.25"
								min="0"
								{...register("feedLitresLightSyrup", { valueAsNumber: true })}
								placeholder="—"
							/>
						</div>
						<div>
							<label htmlFor="wizard-feedLitresHeavySyrup" className="block text-sm font-medium text-foreground mb-1">Heavy Syrup (litres)</label>
							<Input
								id="wizard-feedLitresHeavySyrup"
								type="number"
								step="0.25"
								min="0"
								{...register("feedLitresHeavySyrup", { valueAsNumber: true })}
								placeholder="—"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Supers */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">📦 Supers</CardTitle>
				</CardHeader>
				<CardContent>
					<div>
						<label htmlFor="wizard-supersChange" className="block text-sm font-medium text-foreground mb-1">Supers Change (positive = added, negative = removed)</label>
						<Input
							id="wizard-supersChange"
							type="number"
							step="0.5"
							{...register("supersChange", { valueAsNumber: true })}
							placeholder="—"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ReviewStep() {
	const { register, getValues } = useFormContext<InspectionWizardInput>();

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
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">🌤️ Weather</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="wizard-weatherTemperatureC" className="block text-sm font-medium text-foreground mb-1">Temperature (°C)</label>
							<Input
								id="wizard-weatherTemperatureC"
								type="number"
								step="0.1"
								{...register("weatherTemperatureC", { valueAsNumber: true })}
								placeholder="—"
							/>
						</div>
						<div>
							<label htmlFor="wizard-weatherCondition" className="block text-sm font-medium text-foreground mb-1">Condition</label>
							<Select onValueChange={(v) => register("weatherCondition").onChange({ target: { value: v, name: "weatherCondition" } })}>
								<SelectTrigger>
									<SelectValue placeholder="Select…" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(weatherConditionLabels).map(([k, v]) => (
										<SelectItem key={k} value={k}>{v}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Notes */}
			<div>
				<label htmlFor="wizard-notes" className="block text-sm font-medium text-foreground mb-1">
					Notes
				</label>
				<Textarea
					id="wizard-notes"
					{...register("notes")}
					placeholder="Any additional observations…"
				/>
			</div>

			{/* Summary preview */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-semibold">📋 Summary Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-xs text-muted-foreground space-y-1">
						<p>Queen: {queenSeen ? "Seen" : "Not seen"}{queenColour ? ` (${queenColour})` : ""}</p>
						<p>Eggs: {eggsSeen ? "Yes" : "No"} | Brood pattern: {broodPatternOk ? "OK" : "Not OK"}</p>
						<p>Store frames: {storeFrames ?? "—"} | Room frames: {roomFrames ?? "—"}</p>
						<p>Health: {healthOk ? "No disease signs" : "Disease flags present"}</p>
						<p>Varroa: {varroaLevel || "—"}</p>
						<p>Temperament: {temperamentScore ?? "—"}</p>
						<p>Weather: {weatherTemperatureC ?? "—"}°C, {weatherConditionLabels[weatherCondition as keyof typeof weatherConditionLabels] || weatherCondition || "—"}</p>
					</div>
				</CardContent>
			</Card>
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
				}}
				noValidate
			>
				{/* Step navigation */}
				<nav aria-label="Inspection wizard steps" className="mb-6">
					<ol className="flex items-center gap-2 flex-wrap">
						{STEPS.map((step, i) => (
							<li key={step.id} className="flex items-center">
								<span
									className={`text-sm ${
										i === stepIndex
											? "font-semibold text-primary"
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

				<Separator className="mb-6" />

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
					<Button
						type="button"
						variant="outline"
						onClick={handlePrevious}
						disabled={isFirstStep}
					>
						← Previous
					</Button>

					{!isLastStep && (
						<Button type="button" onClick={handleNext}>
							Next →
						</Button>
					)}
				</div>
			</form>
		</FormProvider>
	);
}

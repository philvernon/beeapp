"use client";

import { useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InspectionWizardSchema, type InspectionWizardInput } from "./inspection-wizard-schema";

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

// Fields that belong to each step. The temporary test field lives on the
// Conditions step.
const STEP_FIELDS: Record<StepId, (keyof InspectionWizardInput)[]> = {
	conditions: ["foundationTestValue"],
	colony: [],
	"stores-actions": [],
	health: [],
	review: [],
};

// ---------------------------------------------------------------------------
// Step content placeholders
// ---------------------------------------------------------------------------

function ConditionsStep() {
	const { register } = useFormContext<InspectionWizardInput>();

	return (
		<div>
			<h2 className="text-lg font-semibold mb-4">Conditions</h2>
			<div>
				<label htmlFor="foundationTestValue" className="block text-sm font-medium mb-1">
					Foundation test field
				</label>
				<input
					id="foundationTestValue"
					type="text"
					{...register("foundationTestValue")}
					placeholder="Type something to prove state survives navigation"
					className="w-full border px-3 py-2 text-sm focus:border-accent focus:outline-none"
				/>
			</div>
		</div>
	);
}

function ColonyStep() {
	return (
		<div>
			<h2 className="text-lg font-semibold mb-4">Colony</h2>
			<p className="text-sm text-muted-foreground">Placeholder — fields coming next.</p>
		</div>
	);
}

function StoresActionsStep() {
	return (
		<div>
			<h2 className="text-lg font-semibold mb-4">Stores & Actions</h2>
			<p className="text-sm text-muted-foreground">Placeholder — fields coming next.</p>
		</div>
	);
}

function HealthStep() {
	return (
		<div>
			<h2 className="text-lg font-semibold mb-4">Health</h2>
			<p className="text-sm text-muted-foreground">Placeholder — fields coming next.</p>
		</div>
	);
}

function ReviewStep() {
	return (
		<div>
			<h2 className="text-lg font-semibold mb-4">Review</h2>
			<p className="text-sm text-muted-foreground">Placeholder — review summary coming next.</p>
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
			foundationTestValue: "",
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

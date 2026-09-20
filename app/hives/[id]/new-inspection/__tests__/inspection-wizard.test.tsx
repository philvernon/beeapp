import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InspectionWizard } from "../inspection-wizard";

describe("InspectionWizard", () => {
	it("starts on the Conditions step (first step)", () => {
		render(<InspectionWizard />);
		expect(screen.getByText(/Step 1: Conditions/)).toBeDefined();
		expect(screen.queryByText(/Next →/)).toBeDefined();
		const prevBtn = screen.getByRole("button", { name: /← Previous/ });
		expect((prevBtn as HTMLButtonElement).disabled).toBe(true);
	});

	it("advances to Colony on Next click", async () => {
		render(<InspectionWizard />);
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => {
			expect(screen.getByText(/Step 2: Colony/)).toBeDefined();
		});
	});

	it("goes back to Conditions on Previous click", async () => {
		render(<InspectionWizard />);
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => {
			expect(screen.getByText(/Step 2: Colony/)).toBeDefined();
		});
		fireEvent.click(screen.getByRole("button", { name: /← Previous/ }));
		await waitFor(() => {
			expect(screen.getByText(/Step 1: Conditions/)).toBeDefined();
		});
	});

	it("disables Previous on the first step and hides Next on the last step", async () => {
		render(<InspectionWizard />);

		// First step: Previous is disabled
		const firstPrev = screen.getByRole("button", { name: /← Previous/ });
		expect((firstPrev as HTMLButtonElement).disabled).toBe(true);

		// Navigate to the last step (Review = step 5)
		for (let i = 0; i < 4; i++) {
			fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
			await waitFor(() =>
				expect(screen.queryByRole("button", { name: /Next →/ })).toBeDefined(),
			);
		}

		expect(screen.getByText(/Step 5: Review/)).toBeDefined();
		const lastPrev = screen.getByRole("button", { name: /← Previous/ });
		expect((lastPrev as HTMLButtonElement).disabled).toBe(false);
		expect(screen.queryByText(/Next →/)).toBeNull();
	});

	it("exposes aria-current=step on the active step in navigation", async () => {
		render(<InspectionWizard />);

		const nav = screen.getByLabelText(/Inspection wizard steps/i);
		const firstStepLabel = nav.querySelector('span[aria-current="step"]');
		expect(firstStepLabel?.textContent).toContain("Conditions");

		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => {
			expect(screen.getByText(/Step 2: Colony/)).toBeDefined();
		});

		const colonyStepLabel = nav.querySelector('span[aria-current="step"]');
		expect(colonyStepLabel?.textContent).toContain("Colony");
	});

	it("retains field value when navigating forward and backward", async () => {
		render(<InspectionWizard />);

		// Type into a Conditions field
		const queenCellsInput = screen.getByLabelText(/Queen Cells Found/i) as HTMLInputElement;
		fireEvent.change(queenCellsInput, { target: { value: "5" } });
		expect(queenCellsInput.value).toBe("5");

		// Navigate to Colony (step 2)
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => {
			expect(screen.getByText(/Step 2: Colony/)).toBeDefined();
		});

		// Navigate back to Conditions (step 1)
		fireEvent.click(screen.getByRole("button", { name: /← Previous/ }));
		await waitFor(() => {
			expect(screen.getByText(/Step 1: Conditions/)).toBeDefined();
		});

		// Value should still be there
		expect(queenCellsInput.value).toBe("5");
	});

	it("shows all five steps in navigation", () => {
		render(<InspectionWizard />);
		const nav = screen.getByLabelText(/Inspection wizard steps/i);
		expect(nav.textContent).toContain("Conditions");
		expect(nav.textContent).toContain("Colony");
		expect(nav.textContent).toContain("Stores & Actions");
		expect(nav.textContent).toContain("Health");
		expect(nav.textContent).toContain("Review");
	});

	it("renders Queen section on Conditions step", () => {
		render(<InspectionWizard />);
		expect(screen.getByText(/👑 Queen/)).toBeDefined();
		expect(screen.getByLabelText(/Queen seen this inspection/i)).toBeDefined();
	});

	it("renders Brood section on Conditions step", () => {
		render(<InspectionWizard />);
		expect(screen.getByText(/🐝 Brood/)).toBeDefined();
		expect(screen.getByLabelText(/Eggs seen/i)).toBeDefined();
		expect(screen.getByLabelText(/Brood pattern OK/i)).toBeDefined();
	});

	it("renders Store/Room frames on Colony step", async () => {
		render(<InspectionWizard />);
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => {
			expect(screen.getByText(/Step 2: Colony/)).toBeDefined();
		});
		expect(screen.getByLabelText(/Store Frames/i)).toBeDefined();
		expect(screen.getByLabelText(/Room Frames/i)).toBeDefined();
	});

	it("renders Health and Varroa on Stores & Actions step", async () => {
		render(<InspectionWizard />);
		// Conditions → Colony → Stores & Actions
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => expect(screen.getByText(/Step 2: Colony/)).toBeDefined());
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => expect(screen.getByText(/Step 3: Stores & Actions/)).toBeDefined());

		expect(screen.getByText(/🏥 Health/)).toBeDefined();
		expect(screen.getByText(/🔬 Varroa/)).toBeDefined();
	});

	it("renders Temperament and Feeding on Health step", async () => {
		render(<InspectionWizard />);
		for (let i = 0; i < 3; i++) {
			fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
			await waitFor(() =>
				expect(screen.queryByRole("button", { name: /Next →/ })).toBeDefined(),
			);
		}
		expect(screen.getByText(/Step 4: Health/)).toBeDefined();
		expect(screen.getByText(/🌡️ Temperament/)).toBeDefined();
		expect(screen.getByText(/🍯 Feeding/)).toBeDefined();
	});

	it("renders Weather and Summary on Review step", async () => {
		render(<InspectionWizard />);
		for (let i = 0; i < 4; i++) {
			fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
			await waitFor(() =>
				expect(screen.queryByRole("button", { name: /Next →/ })).toBeDefined(),
			);
		}
		expect(screen.getByText(/Step 5: Review/)).toBeDefined();
		expect(screen.getByText(/🌤️ Weather/)).toBeDefined();
		expect(screen.getByText(/📋 Summary Preview/)).toBeDefined();
	});

	it("preserves checkbox state across steps", async () => {
		render(<InspectionWizard />);

		// Check "Queen seen" on Conditions
		const queenCheckbox = screen.getByLabelText(/Queen seen this inspection/i) as HTMLInputElement;
		fireEvent.click(queenCheckbox);
		expect(queenCheckbox.checked).toBe(true);

		// Navigate forward and back
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => expect(screen.getByText(/Step 2: Colony/)).toBeDefined());
		fireEvent.click(screen.getByRole("button", { name: /← Previous/ }));
		await waitFor(() => expect(screen.getByText(/Step 1: Conditions/)).toBeDefined());

		expect(queenCheckbox.checked).toBe(true);
	});

	it("shows conditional Queen Colour field when queen is seen", async () => {
		render(<InspectionWizard />);

		const queenCheckbox = screen.getByLabelText(/Queen seen this inspection/i) as HTMLInputElement;
		fireEvent.click(queenCheckbox);

		await waitFor(() => {
			expect(screen.getByText(/Queen Colour/)).toBeDefined();
		});

		const select = screen.getByLabelText(/Queen Colour/);
		expect((select as HTMLSelectElement).value).toBe("");
	});

	it("shows conditional disease flags when health is not OK", async () => {
		render(<InspectionWizard />);

		// Navigate to Stores & Actions step
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => expect(screen.getByText(/Step 2: Colony/)).toBeDefined());
		fireEvent.click(screen.getByRole("button", { name: /Next →/ }));
		await waitFor(() => expect(screen.getByText(/Step 3: Stores & Actions/)).toBeDefined());

		// Uncheck "No disease signs"
		const healthCheckbox = screen.getByLabelText(/No disease signs/i) as HTMLInputElement;
		fireEvent.click(healthCheckbox);
		expect(healthCheckbox.checked).toBe(false);

		await waitFor(() => {
			expect(screen.getByText(/Chalk Brood/)).toBeDefined();
			expect(screen.getByText(/EFB/)).toBeDefined();
			expect(screen.getByText(/AFB/)).toBeDefined();
		});
	});
});

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

		const input = screen.getByLabelText(/Foundation test field/i) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "test-value-123" } });
		expect(input.value).toBe("test-value-123");

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
		expect(input.value).toBe("test-value-123");
	});
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../page";

describe("Home page", () => {
	it('renders h1 with "Beehive Tracking App"', () => {
		render(<Home />);
		expect(screen.getByText(/Beehive Tracking App/).textContent).toContain(
			"Beehive Tracking App",
		);
	});

	it("renders link to /apiaries", () => {
		render(<Home />);
		const link = screen.getByRole("link", { name: /View Apiaries/i });
		expect(link.getAttribute("href")).toBe("/apiaries");
	});

	it("renders link to /hives", () => {
		render(<Home />);
		const link = screen.getByRole("link", { name: /View Hives/i });
		expect(link.getAttribute("href")).toBe("/hives");
	});

	it("renders link to /analytics", () => {
		render(<Home />);
		const link = screen.getByRole("link", { name: /Analytics/i });
		expect(link.getAttribute("href")).toBe("/analytics");
	});
});

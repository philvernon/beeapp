import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../stat-card";

describe("StatCard", () => {
	it("renders label and value", () => {
		render(<StatCard label="Apiaries" value={5} />);
		expect(screen.getByText("Apiaries")).toBeDefined();
		expect(screen.getByText("5")).toBeDefined();
	});

	it("renders numeric value", () => {
		render(<StatCard label="Hives" value={12} />);
		expect(screen.getByText("12")).toBeDefined();
	});

	it("renders string value", () => {
		render(<StatCard label="Queen Seen Rate" value="85%" />);
		expect(screen.getByText("85%")).toBeDefined();
	});

	it("renders optional sub text when provided", () => {
		render(<StatCard label="Queen Seen Rate" value="85%" sub="of 20 inspections" />);
		expect(screen.getByText("of 20 inspections")).toBeDefined();
	});

	it("omits sub text when not provided", () => {
		render(<StatCard label="Apiaries" value={5} />);
		expect(screen.queryByText(/of/i)).toBeNull();
	});
});

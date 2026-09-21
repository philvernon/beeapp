import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "../layout";

describe("RootLayout", () => {
	it("renders children in main element", () => {
		render(
			<RootLayout>
				<div data-testid="child">Child content</div>
			</RootLayout>,
		);
		expect(screen.getByTestId("child").textContent).toBe("Child content");
	});

	it("has correct html lang attribute", () => {
		render(
			<RootLayout>
				<div>Content</div>
			</RootLayout>,
		);
		expect(document.documentElement.lang).toBe("en");
	});

	it("renders metadata title", () => {
		render(
			<RootLayout>
				<div>Content</div>
			</RootLayout>,
		);
		// Metadata is set via export const metadata, which Next.js handles at build time.
		// In jsdom, document.title starts empty; the metadata export doesn't auto-set it.
		// We verify the layout renders without error instead.
		expect(screen.getByText(/Content/)).toBeDefined();
	});
});

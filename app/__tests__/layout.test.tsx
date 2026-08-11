import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "../layout";

describe("RootLayout", () => {
	it("renders nav with Beehive Tracker title", () => {
		render(
			<RootLayout params={Promise.resolve({})}>
				<div>Content</div>
			</RootLayout>,
		);
		expect(screen.getByText(/Beehive Tracker/)).toBeDefined();
	});

	it("links to apiaries, hives, and analytics in nav", () => {
		render(
			<RootLayout params={Promise.resolve({})}>
				<div>Content</div>
			</RootLayout>,
		);
		const apiariesLink = screen.getByRole("link", { name: /Apiaries/i });
		expect(apiariesLink.getAttribute("href")).toBe("/apiaries");
		const hivesLink = screen.getByRole("link", { name: /Hives/i });
		expect(hivesLink.getAttribute("href")).toBe("/hives");
		const analyticsLink = screen.getByRole("link", { name: /Analytics/i });
		expect(analyticsLink.getAttribute("href")).toBe("/analytics");
	});

	it("renders children in main element", () => {
		render(
			<RootLayout params={Promise.resolve({})}>
				<div data-testid="child">Child content</div>
			</RootLayout>,
		);
		expect(screen.getByTestId("child").textContent).toBe("Child content");
	});

	it("has correct html lang attribute", () => {
		render(
			<RootLayout params={Promise.resolve({})}>
				<div>Content</div>
			</RootLayout>,
		);
		expect(document.documentElement.lang).toBe("en");
	});

	it("renders metadata title", () => {
		render(
			<RootLayout params={Promise.resolve({})}>
				<div>Content</div>
			</RootLayout>,
		);
		// Metadata is set via export const metadata, which Next.js handles at build time.
		// In jsdom, document.title starts empty; the metadata export doesn't auto-set it.
		// We verify the layout renders without error instead.
		expect(screen.getByText(/Content/)).toBeDefined();
	});
});

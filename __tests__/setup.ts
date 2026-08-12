import { createElement, type ComponentProps } from "react";
import { vi } from "vitest";

// Prevent "server-only" import errors in test env
vi.mock("server-only", () => ({}));

// Mock next/navigation (used by client components)
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useSearchParams: () => ({ get: vi.fn() }),
	notFound: vi.fn(),
	redirect: vi.fn((url: string) => {
		throw new Error(`Redirect to ${url}`);
	}),
}));

// Mock next/font/google for RootLayout tests
vi.mock("next/font/google", () => ({
	Geist: () => ({ variable: "--font-geist-sans" }),
	Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

// Mock next/link to render plain <a>
vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: ComponentProps<"a">) =>
		createElement("a", { href, ...props }, children),
}));

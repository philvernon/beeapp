import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ApiaryWithHives } from "@/lib/data";
import { ApiaryHivesList } from "../apiary-hives";

const mockApiaries: ApiaryWithHives[] = [
	{
		id: "apiary-1",
		name: "Garden Apiary",
		notes: "Backyard location, south facing",
		createdAt: new Date("2024-01-15"),
		hiveCount: 2,
		hives: [
			{
				id: "hive-1",
				apiaryId: "apiary-1",
				name: "Colony Alpha",
				queenBreed: "Italian",
				queenClipped: false,
				notes: "Strong colony",
				createdAt: new Date("2024-02-01"),
				inspectionCount: 5,
				lastInspection: {
					id: "insp-1",
					inspectionDate: "2025-06-01",
					queenSeen: true,
					healthOk: true,
				},
			},
			{
				id: "hive-2",
				apiaryId: "apiary-1",
				name: "Colony Beta",
				queenBreed: "Carniolan",
				queenClipped: true,
				notes: null,
				createdAt: new Date("2024-03-10"),
				inspectionCount: 3,
				lastInspection: {
					id: "insp-2",
					inspectionDate: "2025-05-28",
					queenSeen: false,
					healthOk: false,
				},
			},
		],
	},
];

const emptyApiaries: ApiaryWithHives[] = [];

describe("ApiaryHivesList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows heading when apiaries exist", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText("Apiaries & Hives")).toBeDefined();
	});

	it("shows empty state when no apiaries", () => {
		render(<ApiaryHivesList apiaries={emptyApiaries} />);
		expect(screen.getByText("No apiaries yet")).toBeDefined();
		expect(screen.getByText("Create your first apiary →")).toBeDefined();
	});

	it("shows apiary name", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText("Garden Apiary")).toBeDefined();
	});

	it("shows apiary description (notes)", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText("Backyard location, south facing")).toBeDefined();
	});

	it("shows total hive count badge", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText("2 hives")).toBeDefined();
	});

	it("shows hive name", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText("Colony Alpha")).toBeDefined();
		expect(screen.getByText("Colony Beta")).toBeDefined();
	});

	it("shows hive description (notes)", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText("Strong colony")).toBeDefined();
	});

	it("shows queen breed for hive", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText(/Queen: Italian/)).toBeDefined();
		expect(screen.getByText(/Queen: Carniolan/)).toBeDefined();
	});

	it("shows last inspected date", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getAllByText(/Last:/).length).toBeGreaterThan(0);
	});

	it("shows queen seen when true", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText(/Queen:.*Seen/)).toBeDefined();
	});

	it("shows queen not seen when false", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText(/Queen:.*Not seen/)).toBeDefined();
	});

	it("shows health OK when true", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText(/Health: OK/)).toBeDefined();
	});

	it("shows health issues when false", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText(/Health: Issues/)).toBeDefined();
	});

	it("shows Clipped badge when queenClipped is true", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		expect(screen.getByText("Clipped")).toBeDefined();
	});

	it("omits clipped badge when queenClipped is false", () => {
		const noClip: ApiaryWithHives[] = [
			{
				...mockApiaries[0],
				hives: [
					{
						...mockApiaries[0].hives[0],
						queenClipped: false,
					},
				],
			},
		];
		render(<ApiaryHivesList apiaries={noClip} />);
		expect(screen.queryByText("Clipped")).toBeNull();
	});

	it("shows no inspections message when lastInspection is null", () => {
		const noInspections: ApiaryWithHives[] = [
			{
				...mockApiaries[0],
				hives: [
					{
						...mockApiaries[0].hives[0],
						lastInspection: null,
					},
				],
			},
		];
		render(<ApiaryHivesList apiaries={noInspections} />);
		expect(screen.getByText("No inspections yet")).toBeDefined();
	});

	it("shows apiary link href", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		const links = document.querySelectorAll("a");
		const apiaryLink = Array.from(links).find((l) => l.getAttribute("href")?.startsWith("/apiaries/"));
		expect(apiaryLink).toBeDefined();
		expect(apiaryLink?.getAttribute("href")).toBe("/apiaries/apiary-1");
	});

	it("shows hive link hrefs", () => {
		render(<ApiaryHivesList apiaries={mockApiaries} />);
		const links = document.querySelectorAll("a");
		const hiveLinks = Array.from(links).filter((l) => l.getAttribute("href")?.startsWith("/hives/"));
		expect(hiveLinks.length).toBe(2);
		expect(hiveLinks[0].getAttribute("href")).toBe("/hives/hive-1");
		expect(hiveLinks[1].getAttribute("href")).toBe("/hives/hive-2");
	});

	it("shows add hive link when apiary has no hives", () => {
		const singleApiaryNoHives: ApiaryWithHives[] = [
			{
				id: "apiary-2",
				name: "Empty Apiary",
				notes: null,
				createdAt: new Date("2024-06-01"),
				hiveCount: 0,
				hives: [],
			},
		];
		render(<ApiaryHivesList apiaries={singleApiaryNoHives} />);
		expect(screen.getByText("No hives in this apiary yet.")).toBeDefined();
		expect(screen.getByText("Add one →")).toBeDefined();
		const addLink = document.querySelector('a[href="/hives/new?apiary_id=apiary-2"]');
		expect(addLink).toBeDefined();
	});

	it("omits apiary notes when null", () => {
		const noNotes: ApiaryWithHives[] = [
			{
				...mockApiaries[0],
				notes: null,
			},
		];
		render(<ApiaryHivesList apiaries={noNotes} />);
		expect(screen.queryByText("Backyard location, south facing")).toBeNull();
	});

	it("omits queen breed when null", () => {
		const noBreed: ApiaryWithHives[] = [
			{
				...mockApiaries[0],
				hives: [
					{
						...mockApiaries[0].hives[0],
						queenBreed: null,
					},
				],
			},
		];
		render(<ApiaryHivesList apiaries={noBreed} />);
		expect(screen.queryByText(/Queen: Italian/)).toBeNull();
	});

	it("omits hive notes when null", () => {
		const noHiveNotes: ApiaryWithHives[] = [
			{
				...mockApiaries[0],
				hives: [
					{
						...mockApiaries[0].hives[0],
						notes: null,
					},
				],
			},
		];
		render(<ApiaryHivesList apiaries={noHiveNotes} />);
		expect(screen.queryByText("Strong colony")).toBeNull();
	});
});

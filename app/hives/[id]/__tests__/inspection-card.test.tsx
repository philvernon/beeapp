import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InspectionCard } from "../inspection-card";

const baseInspection = {
	id: "test-id",
	hiveId: "hive-1",
	inspectionDate: "2025-03-01",
	queenSeen: true,
	queenColour: "Y",
	queenCellsFound: null,
	queenCellsRemoved: null,
	eggsSeen: true,
	broodPatternOk: null,
	broodFrameCount: 8,
	storeFrames: 2,
	roomFrames: 1,
	healthOk: true,
	chalkBroodSuspected: null,
	efbSuspected: null,
	afbSuspected: null,
	varroaLevel: "l",
	varroaCount: 3,
	temperamentScore: 7,
	feedLitresLightSyrup: null,
	feedLitresHeavySyrup: null,
	supersChange: null,
	weatherTemperatureC: null,
	weatherCondition: null,
	notes: null,
	createdAt: new Date(),
	hiveName: "Colony Alpha",
	apiaryName: "Garden Apiary",
};

describe("InspectionCard", () => {
	it("shows Healthy status when healthOk is true", () => {
		render(<InspectionCard inspection={baseInspection} />);
		expect(screen.getByText("Healthy")).toBeDefined();
	});

	it("shows Issues status when healthOk is false", () => {
		const unhealthy = { ...baseInspection, healthOk: false };
		render(<InspectionCard inspection={unhealthy} />);
		expect(screen.getByText("Issues")).toBeDefined();
	});

	it("shows queen seen with colour", () => {
		render(<InspectionCard inspection={baseInspection} />);
		expect(screen.getByText(/Queen/)).toBeDefined();
		expect(screen.getByText(/Seen.*Y/)).toBeDefined();
	});

	it("shows queen not seen when queenSeen is false", () => {
		const noQueen = { ...baseInspection, queenSeen: false };
		render(<InspectionCard inspection={noQueen} />);
		expect(screen.getByText("Not seen")).toBeDefined();
	});

	it("shows eggs status", () => {
		render(<InspectionCard inspection={baseInspection} />);
		const eggRows = screen.getAllByText("Eggs");
		expect(eggRows.length).toBeGreaterThan(0);
		expect(screen.getByText("Yes")).toBeDefined();
	});

	it("shows brood, store, and room frames", () => {
		render(<InspectionCard inspection={baseInspection} />);
		expect(screen.getByText("Brood Frames")).toBeDefined();
		expect(screen.getByText("8")).toBeDefined();
		expect(screen.getByText("Store Frames")).toBeDefined();
		expect(screen.getByText("2")).toBeDefined();
		expect(screen.getByText("Room Frames")).toBeDefined();
		expect(screen.getByText("1")).toBeDefined();
	});

	it("shows varroa level with count", () => {
		render(<InspectionCard inspection={baseInspection} />);
		expect(screen.getByText(/Varroa/)).toBeDefined();
		expect(screen.getByText(/L.*3/)).toBeDefined();
	});

	it("shows temperament score", () => {
		render(<InspectionCard inspection={baseInspection} />);
		expect(screen.getByText(/Temperament/)).toBeDefined();
		expect(screen.getByText(/7.*\/10/)).toBeDefined();
	});

	it("renders notes when present", () => {
		const withNotes = { ...baseInspection, notes: "Colony looking strong" };
		render(<InspectionCard inspection={withNotes} />);
		expect(screen.getByText("Colony looking strong")).toBeDefined();
	});

	it("omits notes when null", () => {
		render(<InspectionCard inspection={baseInspection} />);
		expect(screen.queryByText(/looking/i)).toBeNull();
	});
});

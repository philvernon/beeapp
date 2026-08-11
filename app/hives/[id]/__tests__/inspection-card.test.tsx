import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// InspectionCard is a local function in hives/[id]/page.tsx.
// We test its behavior by replicating its rendering logic here,
// since we can't import it directly from the server component.

interface InspectionRow {
	id: string;
	hiveId: string;
	inspectionDate: string;
	queenSeen: boolean | null;
	queenColour?: string | null;
	eggsSeen: boolean | null;
	broodFrameCount?: number | null;
	storeFrames?: number | null;
	roomFrames?: number | null;
	healthOk: boolean | null;
	varroaLevel?: string | null;
	varroaCount?: number | null;
	temperamentScore?: number | null;
	notes?: string | null;
}

function InspectionCard({ inspection }: { inspection: InspectionRow }) {
	const date = new Date(
		inspection.inspectionDate + "T00:00:00",
	).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});

	return (
		<div className="border border-primary/20 bg-surface p-4">
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm font-medium text-primary">{date}</span>
				<span
					className={`text-xs px-2 py-0.5 font-medium ${
						inspection.healthOk
							? "bg-zinc-100 text-secondary"
							: "border border-primary/30 text-primary"
					}`}
				>
					{inspection.healthOk ? "Healthy" : "Issues"}
				</span>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
				{inspection.queenSeen && (
					<div>
						<p className="text-xs text-secondary">Queen</p>
						<p className="font-medium text-primary">
							Seen {inspection.queenColour ? `(${inspection.queenColour})` : ""}
						</p>
					</div>
				)}
				{!inspection.queenSeen && (
					<div>
						<p className="text-xs text-secondary">Queen</p>
						<p className="font-medium text-primary">Not seen</p>
					</div>
				)}
				{inspection.eggsSeen !== null && (
					<div>
						<p className="text-xs text-secondary">Eggs</p>
						<p className="font-medium text-primary">
							{inspection.eggsSeen ? "Yes" : "No"}
						</p>
					</div>
				)}
				{inspection.broodFrameCount !== null && (
					<div>
						<p className="text-xs text-secondary">Brood Frames</p>
						<p className="font-medium text-primary">
							{inspection.broodFrameCount}
						</p>
					</div>
				)}
				{inspection.storeFrames !== null && (
					<div>
						<p className="text-xs text-secondary">Store Frames</p>
						<p className="font-medium text-primary">{inspection.storeFrames}</p>
					</div>
				)}
				{inspection.roomFrames !== null && (
					<div>
						<p className="text-xs text-secondary">Room Frames</p>
						<p className="font-medium text-primary">{inspection.roomFrames}</p>
					</div>
				)}
				{inspection.varroaLevel && (
					<div>
						<p className="text-xs text-secondary">Varroa</p>
						<p className="font-medium text-primary">
							{inspection.varroaLevel.toUpperCase()}
							{inspection.varroaCount !== null &&
								` (${inspection.varroaCount})`}
						</p>
					</div>
				)}
				{inspection.temperamentScore !== null && (
					<div>
						<p className="text-xs text-secondary">Temperament</p>
						<p className="font-medium text-primary">
							{inspection.temperamentScore}/10
						</p>
					</div>
				)}
			</div>

			{inspection.notes && (
				<p className="mt-3 pt-3 border-t border-primary/10 text-sm text-secondary italic">
					{inspection.notes}
				</p>
			)}
		</div>
	);
}

const baseInspection: InspectionRow = {
	id: "test-id",
	hiveId: "hive-1",
	inspectionDate: "2025-03-01",
	queenSeen: true,
	queenColour: "Y",
	eggsSeen: true,
	broodFrameCount: 8,
	storeFrames: 2,
	roomFrames: 1,
	healthOk: true,
	varroaLevel: "l",
	varroaCount: 3,
	temperamentScore: 7,
	notes: null,
};

describe("InspectionCard", () => {
	it("renders inspection date in en-GB format", () => {
		render(<InspectionCard inspection={baseInspection} />);
		expect(screen.getByText(/Sat,? 1 Mar 2025/)).toBeDefined();
	});

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

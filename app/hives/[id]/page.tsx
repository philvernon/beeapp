import Link from "next/link";
import { notFound } from "next/navigation";
import { getHive, getInspections } from "@/lib/data";

interface InspectionRow {
	id: string;
	hiveId: string;
	inspectionDate: string;
	queenSeen: boolean | null;
	queenColour?: string | null;
	queenCellsFound?: number | null;
	queenCellsRemoved: boolean | null;
	eggsSeen: boolean | null;
	broodPatternOk: boolean | null;
	broodFrameCount?: number | null;
	storeFrames?: number | null;
	roomFrames?: number | null;
	healthOk: boolean | null;
	chalkBroodSuspected: boolean | null;
	efbSuspected: boolean | null;
	afbSuspected: boolean | null;
	varroaLevel?: string | null;
	varroaCount?: number | null;
	temperamentScore?: number | null;
	feedLitresLightSyrup?: string | null;
	feedLitresHeavySyrup?: string | null;
	supersChange?: string | null;
	weatherTemperatureC?: string | null;
	weatherCondition?: string | null;
	notes?: string | null;
	createdAt: Date;
	hiveName?: string | null;
	apiaryName?: string | null;
}

export default async function HiveDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const hive = await getHive(id);

	if (!hive) notFound();

	const inspections = await getInspections(id);

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<Link
					href="/hives"
					className="text-sm text-secondary hover:text-primary/70"
				>
					← Back to Hives
				</Link>
				<div className="flex gap-2">
					<Link
						href={`/hives/${id}/edit`}
						className="border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary hover:bg-zinc-50"
					>
						Edit Hive
					</Link>
					<Link
						href={`/hives/${id}/new-inspection`}
						className="bg-accent px-3 py-1.5 text-sm font-medium text-surface hover:bg-accent/90"
					>
						+ New Inspection
					</Link>
				</div>
			</div>

			{/* Hive Info */}
			<div className="border border-primary/20 bg-surface p-6 shadow-sm mb-8">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-2xl font-bold text-primary">{hive.name}</h1>
						<p className="text-sm text-secondary mt-1">{hive.apiaryName}</p>
					</div>
					{hive.queenClipped && (
						<span className="text-xs bg-zinc-100 text-secondary px-3 py-1 font-medium">
							Queen Clipped
						</span>
					)}
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-primary/10">
					{hive.queenBreed && (
						<div>
							<p className="text-xs text-secondary uppercase tracking-wide">
								Queen Breed
							</p>
							<p className="text-sm font-medium mt-1">{hive.queenBreed}</p>
						</div>
					)}
					<div>
						<p className="text-xs text-secondary uppercase tracking-wide">
							Inspections
						</p>
						<p className="text-sm font-medium mt-1">{inspections.length}</p>
					</div>
					{hive.notes && (
						<div className="col-span-2">
							<p className="text-xs text-secondary uppercase tracking-wide">
								Notes
							</p>
							<p className="text-sm mt-1">{hive.notes}</p>
						</div>
					)}
				</div>
			</div>

			{/* Inspections */}
			<h2 className="text-lg font-semibold text-primary mb-3">
				Inspection History
			</h2>

			{inspections.length === 0 ? (
				<p className="text-secondary text-sm py-8 text-center border border-dashed border-primary/30">
					No inspections recorded yet.{" "}
					<Link
						href={`/hives/${id}/new-inspection`}
						className="text-accent hover:text-accent/80 font-medium"
					>
						Record one →
					</Link>
				</p>
			) : (
				<div className="space-y-3">
					{inspections.map((insp) => (
						<InspectionCard key={insp.id} inspection={insp} />
					))}
				</div>
			)}
		</div>
	);
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
						<p
							className={`font-medium ${inspection.eggsSeen ? "text-primary" : "text-primary"}`}
						>
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

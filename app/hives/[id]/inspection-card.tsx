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

export function InspectionCard({ inspection }: { inspection: InspectionRow }) {
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

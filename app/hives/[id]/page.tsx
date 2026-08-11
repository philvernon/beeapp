import Link from "next/link";
import { notFound } from "next/navigation";
import { getHive, getInspections } from "@/lib/data";
import { InspectionCard } from "./inspection-card";


export default async function HiveDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const hive = await getHive(id);

	if (!hive) notFound();

	const inspections = await getInspections({ hiveId: id });

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


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
				<Link href="/hives" className="text-sm text-muted-foreground hover:text-foreground">
					← Back to Hives
				</Link>
				<div className="flex gap-2">
					<Link
						href={`/hives/${id}/edit`}
						className="inline-flex items-center border border-border bg-background hover:bg-muted text-foreground px-3 py-1.5 text-sm font-medium rounded-none transition-colors"
					>
						Edit Hive
					</Link>
					<Link
						href={`/hives/${id}/new-inspection`}
						className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/80 px-3 py-1.5 text-sm font-medium rounded-none transition-colors"
					>
						+ New Inspection
					</Link>
				</div>
			</div>

			{/* Hive Info */}
			<div className="border border-border bg-card p-6 shadow-sm mb-8">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">{hive.name}</h1>
						<p className="text-sm text-muted-foreground mt-1">{hive.apiaryName}</p>
					</div>
					{hive.queenClipped && (
						<span className="text-xs bg-muted text-muted-foreground px-3 py-1 font-medium rounded-none">
							Queen Clipped
						</span>
					)}
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
					{hive.queenBreed && (
						<div>
							<p className="text-xs text-muted-foreground uppercase tracking-wide">
								Queen Breed
							</p>
							<p className="text-sm font-medium mt-1 text-foreground">{hive.queenBreed}</p>
						</div>
					)}
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Inspections
						</p>
						<p className="text-sm font-medium mt-1 text-foreground">{inspections.length}</p>
					</div>
					{hive.notes && (
						<div className="col-span-2">
							<p className="text-xs text-muted-foreground uppercase tracking-wide">
								Notes
							</p>
							<p className="text-sm mt-1 text-foreground">{hive.notes}</p>
						</div>
					)}
				</div>
			</div>

			{/* Inspections */}
			<h2 className="text-lg font-semibold text-foreground mb-3">
				Inspection History
			</h2>

			{inspections.length === 0 ? (
				<p className="text-muted-foreground text-sm py-8 text-center border border-dashed border-border">
					No inspections recorded yet.{" "}
					<Link
						href={`/hives/${id}/new-inspection`}
						className="text-primary hover:underline font-medium"
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

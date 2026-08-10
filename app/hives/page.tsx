import Link from "next/link";

export const dynamic = "force-dynamic";

import { getHives } from "@/lib/data";

export async function HiveList() {
	const hives = await getHives();

	if (hives.length === 0) {
		return (
			<div className="text-center py-16">
				<p className="text-secondary mb-4">No hives yet</p>
				<Link
					href="/apiaries"
					className="text-accent hover:text-accent/80 font-medium"
				>
					Create an apiary first →
				</Link>
			</div>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{hives.map((h) => (
				<Link
					key={h.id}
					href={`/hives/${h.id}`}
					className="block border border-primary/20 bg-surface p-4 hover:border-accent/50 transition-all"
				>
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-primary">{h.name}</h3>
						{h.queenClipped && (
							<span className="text-xs bg-zinc-100 text-secondary px-2 py-0.5">
								Clipped
							</span>
						)}
					</div>
					<p className="text-sm text-secondary mt-1">{h.apiaryName}</p>
					{h.queenBreed && (
						<p className="text-xs text-secondary mt-1">Queen: {h.queenBreed}</p>
					)}
					<p className="text-xs text-secondary mt-2">
						{h.inspectionCount ?? 0} inspection{h.inspectionCount === 1 ? "" : "s"}
					</p>
				</Link>
			))}
		</div>
	);
}

export default async function HivesPage() {
	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-primary">Hives</h1>
				<Link
					href="/apiaries"
					className="text-sm text-secondary hover:text-primary/70"
				>
					Manage apiaries →
				</Link>
			</div>
			<HiveList />
		</div>
	);
}

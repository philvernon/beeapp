import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

import { getHives } from "@/lib/data";

export async function HiveList() {
	const hives = await getHives();

	if (hives.length === 0) {
		return (
			<div className="text-center py-16">
				<p className="text-muted-foreground mb-4">No hives yet</p>
				<Link
					href="/apiaries"
					className="text-primary hover:underline font-medium"
				>
					Create an apiary first →
				</Link>
			</div>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{hives.map((h) => (
				<Link key={h.id} href={`/hives/${h.id}`} className="block">
					<Card className="h-full group hover:shadow-sm transition-shadow">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>{h.name}</CardTitle>
								{h.queenClipped && (
									<span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 font-medium rounded-none">
										Clipped
									</span>
								)}
							</div>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							<p className="text-xs text-muted-foreground">{h.apiaryName}</p>
							{h.queenBreed && (
								<p className="text-xs text-muted-foreground">Queen: {h.queenBreed}</p>
							)}
							<p className="mt-auto text-xs text-muted-foreground">
								{h.inspectionCount ?? 0} inspection{h.inspectionCount === 1 ? "" : "s"}
							</p>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

export default async function HivesPage() {
	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-foreground">Hives</h1>
				<Link href="/apiaries" className="text-sm text-muted-foreground hover:text-foreground/70">
					Manage apiaries →
				</Link>
			</div>
			<HiveList />
		</div>
	);
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiaryWithHives } from "@/lib/data";

export default async function ApiaryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const apiary = await getApiaryWithHives(id);

	if (!apiary) notFound();

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<Link
					href="/apiaries"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to Apiaries
				</Link>
				<div className="flex gap-2">
					<Link
						href={`/apiaries/${id}/edit`}
						className="border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-none transition-colors"
					>
						Edit
					</Link>
					<Link
						href={`/hives/new?apiary_id=${id}`}
						className="bg-primary text-primary-foreground hover:bg-primary/80 px-3 py-1.5 text-sm font-medium rounded-none transition-colors"
					>
						+ New Hive
					</Link>
				</div>
			</div>

			<div className="mb-6">
				<h1 className="text-2xl font-bold text-foreground">{apiary.name}</h1>
				{apiary.notes && (
					<p className="mt-1 text-sm text-muted-foreground">{apiary.notes}</p>
				)}
				<p className="mt-1 text-xs text-muted-foreground">
					Created {new Date(apiary.createdAt).toLocaleDateString()}
				</p>
			</div>

			<h2 className="text-lg font-semibold text-foreground mb-3">
				Hives ({apiary.hives?.length || 0})
			</h2>

			{!apiary.hives || apiary.hives.length === 0 ? (
				<p className="text-muted-foreground text-sm py-8 text-center border border-dashed border-border">
					No hives in this apiary yet.{" "}
					<Link
						href={`/hives/new?apiary_id=${id}`}
						className="text-primary hover:underline font-medium"
					>
						Add one →
					</Link>
				</p>
			) : (
				<div className="grid gap-3 sm:grid-cols-2">
					{apiary.hives.map((hive) => (
						<Link
							key={hive.id}
							href={`/hives/${hive.id}`}
							className="block border border-border bg-card p-4 hover:border-border/80 transition-colors"
						>
							<div className="flex items-center justify-between">
								<span className="font-medium text-foreground">{hive.name}</span>
								{hive.queenClipped && (
									<span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 font-medium rounded-none">
										Clipped
									</span>
								)}
							</div>
							{hive.queenBreed && (
								<p className="text-sm text-muted-foreground mt-1">
									Queen: {hive.queenBreed}
								</p>
							)}
							<p className="text-xs text-muted-foreground mt-2">
								{hive.inspectionCount ?? 0} inspection{hive.inspectionCount === 1 ? "" : "s"}
							</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

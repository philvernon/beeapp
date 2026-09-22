import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiaryWithHives } from "@/lib/data";

export const dynamic = "force-dynamic";

// ── Presentational component (sync, testable) ──────────────

interface ApiaryHivesListProps {
	apiaries: ApiaryWithHives[];
}

export function ApiaryHivesList({ apiaries }: ApiaryHivesListProps) {
	if (apiaries.length === 0) {
		return (
			<div>
				<h1 className="text-2xl font-bold text-foreground mb-6">Apiaries & Hives</h1>
				<div className="text-center py-16">
					<p className="text-muted-foreground mb-4">No apiaries yet</p>
					<Link
						href="/apiaries/new"
						className="text-primary hover:underline font-medium"
					>
						Create your first apiary →
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold text-foreground mb-6">Apiaries & Hives</h1>
			<div className="flex flex-col gap-6">
				{apiaries.map((apiary) => (
					<div key={apiary.id}>
						{/* Apiary card */}
						<Link href={`/apiaries/${apiary.id}`} className="block">
							<Card className="group hover:shadow-sm transition-shadow mb-3">
								<CardHeader className="pb-2 px-4 py-3">
									<div className="flex items-center justify-between">
										<CardTitle className="text-sm font-medium">
											{apiary.name}
										</CardTitle>
										<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 font-medium">
											{apiary.hiveCount} hive{apiary.hiveCount !== 1 ? "s" : ""}
										</span>
									</div>
								</CardHeader>
								<CardContent className="px-4 pb-3 pt-0">
									{apiary.notes && (
										<p className="text-xs text-muted-foreground line-clamp-2">
											{apiary.notes}
										</p>
									)}
								</CardContent>
							</Card>
						</Link>

						{/* Hive cards */}
						<div className="grid auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-3">
							{apiary.hives.map((hive) => (
								<Link
									key={hive.id}
									href={`/hives/${hive.id}`}
									className="block"
								>
									<Card className="group hover:shadow-sm transition-shadow">
										<CardHeader className="pb-1 px-3 py-2">
											<div className="flex items-center justify-between">
												<CardTitle className="text-xs font-medium truncate">
													{hive.name}
												</CardTitle>
												{hive.queenClipped && (
													<span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 font-medium whitespace-nowrap">
														Clipped
													</span>
												)}
											</div>
										</CardHeader>
										<CardContent className="px-3 pb-2 pt-0">
											<div className="flex flex-col gap-1">
												{hive.queenBreed && (
													<p className="text-xs text-muted-foreground">
														Queen: {hive.queenBreed}
													</p>
												)}
												{hive.notes && (
													<p className="text-xs text-muted-foreground line-clamp-1">
														{hive.notes}
													</p>
												)}
												{hive.lastInspection ? (
													<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
														<span>
															Last:{" "}
															{new Date(
																hive.lastInspection.inspectionDate,
															).toLocaleDateString()}
														</span>
														<span
															className={
																hive.lastInspection.queenSeen
																	? "text-green-600"
																	: ""
															}
														>
															Queen:{" "}
															{hive.lastInspection.queenSeen
																? "Seen"
																: "Not seen"}
														</span>
														<span
															className={
																hive.lastInspection.healthOk
																	? "text-green-600"
																	: ""
															}
														>
															Health:{" "}
															{hive.lastInspection.healthOk
																? "OK"
																: "Issues"}
														</span>
													</div>
												) : (
													<p className="text-[11px] text-muted-foreground mt-1">
														No inspections yet
													</p>
												)}
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>

						{apiary.hives.length === 0 && (
							<p className="text-xs text-muted-foreground py-2 px-1">
								No hives in this apiary yet.{" "}
								<Link
									href={`/hives/new?apiary_id=${apiary.id}`}
									className="text-primary hover:underline"
								>
									Add one →
								</Link>
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

// ── Server wrapper ──────────────────────────────────────────

export async function ApiaryHives() {
	const { getApiariesWithHives } = await import("@/lib/data");
	const apiaries = await getApiariesWithHives();
	return <ApiaryHivesList apiaries={apiaries} />;
}

export default ApiaryHives;

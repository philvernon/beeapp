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
      <div className="flex flex-col gap-3">
        {apiaries
          .filter((a) => a.hives.length > 0)
          .map((apiary) => (
            <div key={apiary.id}>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {apiary.name}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({apiary.hiveCount} hive{apiary.hiveCount !== 1 ? "s" : ""})
                </span>
              </h2>
              {apiary.notes && (
                <p className="text-xs text-muted-foreground mb-3">
                  {apiary.notes}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {apiary.hives.map((hive) => (
                  <Link
                    key={hive.id}
                    href={`/hives/${hive.id}`}
                    className="block"
                  >
                    <Card className="h-full group hover:shadow-sm transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{hive.name}</CardTitle>
                          {hive.queenClipped && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 font-medium rounded-none">
                              Clipped
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        {hive.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {hive.notes}
                          </p>
                        )}
                        {hive.queenBreed && (
                          <p className="text-xs text-muted-foreground">
                            Queen: {hive.queenBreed}
                          </p>
                        )}
                        {hive.lastInspection ? (
                          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
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
                              {hive.lastInspection.healthOk ? "OK" : "Issues"}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-auto text-xs text-muted-foreground">
                            No inspections yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
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

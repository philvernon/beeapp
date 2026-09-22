import Link from "next/link";
import { getApiaries, getHives, getInspections } from "@/lib/data";
import { ApiaryHives } from "@/components/apiary-hives";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [apiaries, hives, inspections] = await Promise.all([
    getApiaries(),
    getHives(),
    getInspections(),
  ]);

  // Compute stats
  const totalHives = hives.length;
  const totalInspections = inspections.length;
  const totalApiaries = apiaries.length;

  // Queen seen rate
  const queenSeenCount = inspections.filter((i) => i.queenSeen).length;
  const queenSeenRate =
    totalInspections > 0
      ? Math.round((queenSeenCount / totalInspections) * 100)
      : 0;

  // Eggs seen rate (proxy for healthy laying queen)
  const eggsSeenCount = inspections.filter((i) => i.eggsSeen).length;
  const eggsRate =
    totalInspections > 0
      ? Math.round((eggsSeenCount / totalInspections) * 100)
      : 0;

  // Health rate
  const healthOkCount = inspections.filter((i) => i.healthOk).length;
  const healthRate =
    totalInspections > 0
      ? Math.round((healthOkCount / totalInspections) * 100)
      : 0;

  // Varroa levels
  const varroaLow = inspections.filter((i) => i.varroaLevel === "l").length;
  const varroaMed = inspections.filter((i) => i.varroaLevel === "m").length;
  const varroaHigh = inspections.filter((i) => i.varroaLevel === "h").length;

  // Average brood frames
  const broodCounts = inspections
    .map((i) => i.broodFrameCount)
    .filter((n): n is number => n != null && n > 0);
  const avgBroodFrames =
    broodCounts.length > 0
      ? Math.round(
          (broodCounts.reduce((a, b) => a + b, 0) / broodCounts.length) * 10,
        ) / 10
      : null;

  // Average store frames
  const storeCounts = inspections
    .map((i) => i.storeFrames)
    .filter((n): n is number => n != null && n > 0);
  const avgStoreFrames =
    storeCounts.length > 0
      ? Math.round(
          (storeCounts.reduce((a, b) => a + b, 0) / storeCounts.length) * 10,
        ) / 10
      : null;

  // Average temperament
  const tempScores = inspections
    .map((i) => i.temperamentScore)
    .filter((n): n is number => n != null);
  const avgTemperament =
    tempScores.length > 0
      ? Math.round(
          (tempScores.reduce((a, b) => a + b, 0) / tempScores.length) * 10,
        ) / 10
      : null;

  // Per-hive inspection counts
  const hiveStats = hives
    .map((h) => {
      const hiveInspections = inspections.filter((i) => i.hiveId === h.id);
      return {
        id: h.id,
        name: h.name,
        apiaryName: h.apiaryName,
        inspectionCount: hiveInspections.length,
        lastInspection:
          hiveInspections.length > 0
            ? new Date(hiveInspections[0].inspectionDate).toLocaleDateString(
                "en-GB",
              )
            : "—",
      };
    })
    .sort((a, b) => b.inspectionCount - a.inspectionCount);

  // Recent inspections (last 10)
  const recentInspections = inspections.slice(0, 10).map((i) => ({
    ...i,
    date: new Date(i.inspectionDate + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <div>
      {/* Apiaries & Hives */}
      <div className="mb-8">
        <ApiaryHives />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-6">Overview</h1>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <StatCard label="Apiaries" value={totalApiaries} />
        <StatCard label="Hives" value={totalHives} />
        <StatCard label="Inspections" value={totalInspections} />
        <StatCard
          label="Queen Seen Rate"
          value={`${queenSeenRate}%`}
          sub={`of ${totalInspections} inspections`}
        />
        <StatCard
          label="Eggs Seen Rate"
          value={`${eggsRate}%`}
          sub="laying activity"
        />
        <StatCard
          label="Health Rate"
          value={`${healthRate}%`}
          sub="no disease signs"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Varroa Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Varroa Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Low</span>
                  <span className="font-medium text-foreground">
                    {varroaLow}
                  </span>
                </div>
                <Progress
                  value={
                    totalInspections > 0
                      ? (varroaLow / totalInspections) * 100
                      : 0
                  }
                  className="h-2"
                >
                  <ProgressIndicator className="bg-primary" />
                </Progress>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Medium</span>
                  <span className="font-medium text-foreground">
                    {varroaMed}
                  </span>
                </div>
                <Progress
                  value={
                    totalInspections > 0
                      ? (varroaMed / totalInspections) * 100
                      : 0
                  }
                  className="h-2"
                >
                  <ProgressIndicator className="bg-primary" />
                </Progress>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">High</span>
                  <span className="font-medium text-foreground">
                    {varroaHigh}
                  </span>
                </div>
                <Progress
                  value={
                    totalInspections > 0
                      ? (varroaHigh / totalInspections) * 100
                      : 0
                  }
                  className="h-2"
                >
                  <ProgressIndicator className="bg-destructive" />
                </Progress>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Averages */}
        <Card>
          <CardHeader>
            <CardTitle>Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {avgBroodFrames !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Brood Frames
                  </span>
                  <span className="font-medium text-foreground">
                    {avgBroodFrames}
                  </span>
                </div>
              )}
              {avgStoreFrames !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Store Frames
                  </span>
                  <span className="font-medium text-foreground">
                    {avgStoreFrames}
                  </span>
                </div>
              )}
              {avgTemperament !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Temperament
                  </span>
                  <span className="font-medium text-foreground">
                    {avgTemperament}/10
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hive Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Hive Inspection Counts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {hiveStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-5">
              No hives to show.{" "}
              <Link href="/apiaries" className="text-primary hover:underline">
                Create an apiary
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div>
              {hiveStats.map((h, idx) => (
                <div key={h.id}>
                  {idx > 0 && <Separator />}
                  <Link
                    href={`/hives/${h.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {h.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.apiaryName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {h.inspectionCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        last: {h.lastInspection}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentInspections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-5">
              No inspections yet.
            </p>
          ) : (
            <div>
              {recentInspections.map((i, idx) => (
                <div key={i.id}>
                  {idx > 0 && <Separator />}
                  <Link
                    href={`/hives/${i.hiveId}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {i.date}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i.hiveName} ({i.apiaryName})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {i.queenSeen && (
                        <Badge variant="secondary">Queen ✓</Badge>
                      )}
                      {i.healthOk === false && (
                        <Badge variant="outline">Issues</Badge>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

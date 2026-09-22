import Link from "next/link";
import { getApiaries, getHives, getInspections } from "@/lib/data";
import { inspections as inspectionsTable } from "@/lib/schema";
import { ApiaryHives } from "@/components/apiary-hives";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

interface HiveStat {
  id: string;
  name: string;
  apiaryName: string | null;
  inspectionCount: number;
  lastInspection: string;
}

interface RecentInspection {
  id: string;
  hiveId: string;
  hiveName: string | null;
  apiaryName: string | null;
  date: string;
  queenSeen: boolean | null;
  healthOk: boolean | null;
}

interface AnalyticsData {
  totalHives: number;
  totalInspections: number;
  totalApiaries: number;
  queenSeenRate: number;
  eggsRate: number;
  healthRate: number;
  varroaLow: number;
  varroaMed: number;
  varroaHigh: number;
  avgBroodFrames: number | null;
  avgStoreFrames: number | null;
  avgTemperament: number | null;
  hiveStats: HiveStat[];
  recentInspections: RecentInspection[];
}

function computeAnalytics(
  apiaries: { id: string; name: string }[],
  hives: { id: string; name: string; apiaryName: string | null }[],
  inspections: (typeof inspectionsTable.$inferSelect & { hiveName: string | null; apiaryName: string | null })[],
): AnalyticsData {
  const totalHives = hives.length;
  const totalInspections = inspections.length;
  const totalApiaries = apiaries.length;

  const queenSeenRate =
    totalInspections > 0
      ? Math.round(
          (inspections.filter((i) => i.queenSeen).length / totalInspections) *
            100,
        )
      : 0;

  const eggsRate =
    totalInspections > 0
      ? Math.round(
          (inspections.filter((i) => i.eggsSeen).length / totalInspections) *
            100,
        )
      : 0;

  const healthRate =
    totalInspections > 0
      ? Math.round(
          (inspections.filter((i) => i.healthOk).length / totalInspections) *
            100,
        )
      : 0;

  const varroaLow = inspections.filter(
    (i) => i.varroaLevel === "l",
  ).length;
  const varroaMed = inspections.filter(
    (i) => i.varroaLevel === "m",
  ).length;
  const varroaHigh = inspections.filter(
    (i) => i.varroaLevel === "h",
  ).length;

  const broodCounts = inspections
    .map((i) => i.broodFrameCount)
    .filter((n): n is number => n != null && n > 0);
  const avgBroodFrames =
    broodCounts.length > 0
      ? Math.round(
          (broodCounts.reduce((a, b) => a + b, 0) / broodCounts.length) * 10,
        ) / 10
      : null;

  const storeCounts = inspections
    .map((i) => i.storeFrames)
    .filter((n): n is number => n != null && n > 0);
  const avgStoreFrames =
    storeCounts.length > 0
      ? Math.round(
          (storeCounts.reduce((a, b) => a + b, 0) / storeCounts.length) * 10,
        ) / 10
      : null;

  const tempScores = inspections
    .map((i) => i.temperamentScore)
    .filter((n): n is number => n != null);
  const avgTemperament =
    tempScores.length > 0
      ? Math.round(
          (tempScores.reduce((a, b) => a + b, 0) / tempScores.length) * 10,
        ) / 10
      : null;

  const hiveStats: HiveStat[] = hives
    .map((h) => {
      const hiveInspections = inspections.filter((i) => i.hiveId === h.id);
      return {
        id: h.id,
        name: h.name,
        apiaryName: h.apiaryName,
        inspectionCount: hiveInspections.length,
        lastInspection:
          hiveInspections.length > 0
            ? formatDate(hiveInspections[0].inspectionDate)
            : "—",
      };
    })
    .sort((a, b) => b.inspectionCount - a.inspectionCount);

  const recentInspections: RecentInspection[] = inspections
    .slice(0, 10)
    .map((i) => ({
      ...i,
      date: formatDate(i.inspectionDate, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }));

  return {
    totalHives,
    totalInspections,
    totalApiaries,
    queenSeenRate,
    eggsRate,
    healthRate,
    varroaLow,
    varroaMed,
    varroaHigh,
    avgBroodFrames,
    avgStoreFrames,
    avgTemperament,
    hiveStats,
    recentInspections,
  };
}

export default async function AnalyticsPage() {
  const [apiaries, hives, inspections] = await Promise.all([
    getApiaries(),
    getHives(),
    getInspections(),
  ]);

  const analytics = computeAnalytics(apiaries, hives, inspections);

  return (
    <div>
      {/* Apiaries & Hives */}
      <div className="mb-8">
        <ApiaryHives />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-6">Overview</h1>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <StatCard label="Apiaries" value={analytics.totalApiaries} />
        <StatCard label="Hives" value={analytics.totalHives} />
        <StatCard
          label="Inspections"
          value={analytics.totalInspections}
        />
        <StatCard
          label="Queen Seen Rate"
          value={`${analytics.queenSeenRate}%`}
          sub={`of ${analytics.totalInspections} inspections`}
        />
        <StatCard
          label="Eggs Seen Rate"
          value={`${analytics.eggsRate}%`}
          sub="laying activity"
        />
        <StatCard
          label="Health Rate"
          value={`${analytics.healthRate}%`}
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
                    {analytics.varroaLow}
                  </span>
                </div>
                <Progress
                  value={
                    analytics.totalInspections > 0
                      ? (analytics.varroaLow / analytics.totalInspections) *
                        100
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
                    {analytics.varroaMed}
                  </span>
                </div>
                <Progress
                  value={
                    analytics.totalInspections > 0
                      ? (analytics.varroaMed / analytics.totalInspections) *
                        100
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
                    {analytics.varroaHigh}
                  </span>
                </div>
                <Progress
                  value={
                    analytics.totalInspections > 0
                      ? (analytics.varroaHigh / analytics.totalInspections) *
                        100
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
              {analytics.avgBroodFrames !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Brood Frames
                  </span>
                  <span className="font-medium text-foreground">
                    {analytics.avgBroodFrames}
                  </span>
                </div>
              )}
              {analytics.avgStoreFrames !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Store Frames
                  </span>
                  <span className="font-medium text-foreground">
                    {analytics.avgStoreFrames}
                  </span>
                </div>
              )}
              {analytics.avgTemperament !== null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Temperament
                  </span>
                  <span className="font-medium text-foreground">
                    {analytics.avgTemperament}/10
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
          {analytics.hiveStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-5">
              No hives to show.{" "}
              <Link href="/apiaries" className="text-primary hover:underline">
                Create an apiary
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div>
              {analytics.hiveStats.map((h, idx) => (
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
          {analytics.recentInspections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-5">
              No inspections yet.
            </p>
          ) : (
            <div>
              {analytics.recentInspections.map((i, idx) => (
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

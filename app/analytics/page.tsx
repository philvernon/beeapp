import Link from 'next/link';
import { getApiaries, getHives, getInspections } from '@/lib/data';
import { StatCard } from './stat-card';

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
  const queenSeenRate = totalInspections > 0 ? Math.round((queenSeenCount / totalInspections) * 100) : 0;

  // Eggs seen rate (proxy for healthy laying queen)
  const eggsSeenCount = inspections.filter((i) => i.eggsSeen).length;
  const eggsRate = totalInspections > 0 ? Math.round((eggsSeenCount / totalInspections) * 100) : 0;

  // Health rate
  const healthOkCount = inspections.filter((i) => i.healthOk).length;
  const healthRate = totalInspections > 0 ? Math.round((healthOkCount / totalInspections) * 100) : 0;

  // Varroa levels
  const varroaLow = inspections.filter((i) => i.varroaLevel === 'l').length;
  const varroaMed = inspections.filter((i) => i.varroaLevel === 'm').length;
  const varroaHigh = inspections.filter((i) => i.varroaLevel === 'h').length;

  // Average brood frames
  const broodCounts = inspections
    .map((i) => i.broodFrameCount)
    .filter((n): n is number => n != null && n > 0);
  const avgBroodFrames = broodCounts.length > 0
    ? Math.round(broodCounts.reduce((a, b) => a + b, 0) / broodCounts.length * 10) / 10
    : null;

  // Average store frames
  const storeCounts = inspections
    .map((i) => i.storeFrames)
    .filter((n): n is number => n != null && n > 0);
  const avgStoreFrames = storeCounts.length > 0
    ? Math.round(storeCounts.reduce((a, b) => a + b, 0) / storeCounts.length * 10) / 10
    : null;

  // Average temperament
  const tempScores = inspections
    .map((i) => i.temperamentScore)
    .filter((n): n is number => n != null);
  const avgTemperament = tempScores.length > 0
    ? Math.round(tempScores.reduce((a, b) => a + b, 0) / tempScores.length * 10) / 10
    : null;

  // Per-hive inspection counts
  const hiveStats = hives.map((h) => {
    const hiveInspections = inspections.filter((i) => i.hiveId === h.id);
    return {
      id: h.id,
      name: h.name,
      apiaryName: h.apiaryName,
      inspectionCount: hiveInspections.length,
      lastInspection: hiveInspections.length > 0
        ? new Date(hiveInspections[0].inspectionDate).toLocaleDateString('en-GB')
        : '—',
    };
  }).sort((a, b) => b.inspectionCount - a.inspectionCount);

  // Recent inspections (last 10)
  const recentInspections = inspections.slice(0, 10).map((i) => ({
    ...i,
    date: new Date(i.inspectionDate + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    }),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <StatCard label="Apiaries" value={totalApiaries} />
        <StatCard label="Hives" value={totalHives} />
        <StatCard label="Inspections" value={totalInspections} />
        <StatCard label="Queen Seen Rate" value={`${queenSeenRate}%`} sub={`of ${totalInspections} inspections`} />
        <StatCard label="Eggs Seen Rate" value={`${eggsRate}%`} sub="laying activity" />
        <StatCard label="Health Rate" value={`${healthRate}%`} sub="no disease signs" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Varroa Summary */}
        <div className="border border-primary/20 bg-surface p-5">
          <h2 className="text-sm font-semibold text-primary mb-3">Varroa Levels</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Low</span>
              <span className="font-medium text-primary">{varroaLow}</span>
            </div>
            <div className="w-full bg-zinc-100 h-2">
              <div className="bg-accent h-2" style={{ width: `${totalInspections > 0 ? (varroaLow / totalInspections) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Medium</span>
              <span className="font-medium text-primary">{varroaMed}</span>
            </div>
            <div className="w-full bg-zinc-100 h-2">
              <div className="bg-accent h-2" style={{ width: `${totalInspections > 0 ? (varroaMed / totalInspections) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">High</span>
              <span className="font-medium text-primary">{varroaHigh}</span>
            </div>
            <div className="w-full bg-zinc-100 h-2">
              <div className="bg-primary/40 h-2" style={{ width: `${totalInspections > 0 ? (varroaHigh / totalInspections) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Averages */}
        <div className="border border-primary/20 bg-surface p-5">
          <h2 className="text-sm font-semibold text-primary mb-3">Averages</h2>
          <div className="space-y-3">
            {avgBroodFrames !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary">Avg Brood Frames</span>
                <span className="font-medium text-primary">{avgBroodFrames}</span>
              </div>
            )}
            {avgStoreFrames !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary">Avg Store Frames</span>
                <span className="font-medium text-primary">{avgStoreFrames}</span>
              </div>
            )}
            {avgTemperament !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary">Avg Temperament</span>
                <span className="font-medium text-primary">{avgTemperament}/10</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hive Performance */}
      <div className="border border-primary/20 bg-surface shadow-sm mb-8">
        <div className="p-5 border-b border-primary/10">
          <h2 className="text-sm font-semibold text-primary">Hive Inspection Counts</h2>
        </div>
        {hiveStats.length === 0 ? (
          <p className="p-5 text-sm text-secondary text-center">No hives to show. <Link href="/apiaries" className="text-accent hover:text-accent/80">Create an apiary</Link> to get started.</p>
        ) : (
          <div className="divide-y divide-primary/10">
            {hiveStats.map((h) => (
              <Link key={h.id} href={`/hives/${h.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-primary">{h.name}</p>
                  <p className="text-xs text-secondary">{h.apiaryName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{h.inspectionCount}</p>
                  <p className="text-xs text-secondary">last: {h.lastInspection}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Inspections */}
      <div className="border border-primary/20 bg-surface shadow-sm">
        <div className="p-5 border-b border-primary/10">
          <h2 className="text-sm font-semibold text-primary">Recent Inspections</h2>
        </div>
        {recentInspections.length === 0 ? (
          <p className="p-5 text-sm text-secondary text-center">No inspections yet.</p>
        ) : (
          <div className="divide-y divide-primary/10">
            {recentInspections.map((i) => (
              <Link key={i.id} href={`/hives/${i.hiveId}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-primary">{i.date}</p>
                  <p className="text-xs text-secondary">{i.hiveName} ({i.apiaryName})</p>
                </div>
                <div className="flex items-center gap-3">
                  {i.queenSeen && <span className="text-xs bg-zinc-100 text-secondary px-2 py-0.5">Queen ✓</span>}
                  {i.healthOk === false && <span className="text-xs border border-primary/30 text-primary px-2 py-0.5">Issues</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

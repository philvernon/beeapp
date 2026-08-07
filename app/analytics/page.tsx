import Link from 'next/link';

async function getAnalyticsData() {
  const [apiariesRes, hivesRes, inspectionsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/apiaries`),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hives`),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/inspections`),
  ]);

  const apiaries = apiariesRes.ok ? await apiariesRes.json() : [];
  const hives = hivesRes.ok ? await hivesRes.json() : [];
  const inspections = inspectionsRes.ok ? await inspectionsRes.json() : [];

  // Compute stats
  const totalHives = hives.length;
  const totalInspections = inspections.length;
  const totalApiaries = apiaries.length;

  // Queen seen rate
  const queenSeenCount = inspections.filter((i: any) => i.queen_seen).length;
  const queenSeenRate = totalInspections > 0 ? Math.round((queenSeenCount / totalInspections) * 100) : 0;

  // Eggs seen rate (proxy for healthy laying queen)
  const eggsSeenCount = inspections.filter((i: any) => i.eggs_seen).length;
  const eggsRate = totalInspections > 0 ? Math.round((eggsSeenCount / totalInspections) * 100) : 0;

  // Health rate
  const healthOkCount = inspections.filter((i: any) => i.health_ok).length;
  const healthRate = totalInspections > 0 ? Math.round((healthOkCount / totalInspections) * 100) : 0;

  // Varroa levels
  const varroaLow = inspections.filter((i: any) => i.varroa_level === 'l').length;
  const varroaMed = inspections.filter((i: any) => i.varroa_level === 'm').length;
  const varroaHigh = inspections.filter((i: any) => i.varroa_level === 'h').length;

  // Average brood frames
  const broodCounts = inspections
    .map((i: any) => i.brood_frame_count)
    .filter((n: number | null) => n !== null && n > 0);
  const avgBroodFrames = broodCounts.length > 0
    ? Math.round(broodCounts.reduce((a: number, b: number) => a + b, 0) / broodCounts.length * 10) / 10
    : null;

  // Average store frames
  const storeCounts = inspections
    .map((i: any) => i.store_frames)
    .filter((n: number | null) => n !== null && n > 0);
  const avgStoreFrames = storeCounts.length > 0
    ? Math.round(storeCounts.reduce((a: number, b: number) => a + b, 0) / storeCounts.length * 10) / 10
    : null;

  // Average temperament
  const tempScores = inspections
    .map((i: any) => i.temperament_score)
    .filter((n: number | null) => n !== null);
  const avgTemperament = tempScores.length > 0
    ? Math.round(tempScores.reduce((a: number, b: number) => a + b, 0) / tempScores.length * 10) / 10
    : null;

  // Per-hive inspection counts
  const hiveStats = hives.map((h: any) => {
    const hiveInspections = inspections.filter((i: any) => i.hive_id === h.id);
    return {
      id: h.id,
      name: h.name,
      apiary_name: h.apiary_name,
      inspectionCount: hiveInspections.length,
      lastInspection: hiveInspections.length > 0
        ? new Date(hiveInspections[0].inspection_date).toLocaleDateString('en-GB')
        : '—',
    };
  }).sort((a: any, b: any) => b.inspectionCount - a.inspectionCount);

  // Recent inspections (last 10)
  const recentInspections = inspections.slice(0, 10).map((i: any) => ({
    ...i,
    date: new Date(i.inspection_date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    }),
  }));

  return {
    totalApiaries, totalHives, totalInspections,
    queenSeenRate, eggsRate, healthRate,
    varroaLow, varroaMed, varroaHigh,
    avgBroodFrames, avgStoreFrames, avgTemperament,
    hiveStats, recentInspections,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs text-zinc-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <StatCard label="Apiaries" value={data.totalApiaries} />
        <StatCard label="Hives" value={data.totalHives} />
        <StatCard label="Inspections" value={data.totalInspections} />
        <StatCard label="Queen Seen Rate" value={`${data.queenSeenRate}%`} sub={`of ${data.totalInspections} inspections`} />
        <StatCard label="Eggs Seen Rate" value={`${data.eggsRate}%`} sub="laying activity" />
        <StatCard label="Health Rate" value={`${data.healthRate}%`} sub="no disease signs" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Varroa Summary */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Varroa Levels</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">🟢 Low</span>
              <span className="font-medium">{data.varroaLow}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${data.totalInspections > 0 ? (data.varroaLow / data.totalInspections) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-700">🟡 Medium</span>
              <span className="font-medium">{data.varroaMed}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${data.totalInspections > 0 ? (data.varroaMed / data.totalInspections) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700">🔴 High</span>
              <span className="font-medium">{data.varroaHigh}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${data.totalInspections > 0 ? (data.varroaHigh / data.totalInspections) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Averages */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Averages</h2>
          <div className="space-y-3">
            {data.avgBroodFrames !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Avg Brood Frames</span>
                <span className="font-medium">{data.avgBroodFrames}</span>
              </div>
            )}
            {data.avgStoreFrames !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Avg Store Frames</span>
                <span className="font-medium">{data.avgStoreFrames}</span>
              </div>
            )}
            {data.avgTemperament !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Avg Temperament</span>
                <span className="font-medium">{data.avgTemperament}/10</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hive Performance */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm mb-8">
        <div className="p-5 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900">Hive Inspection Counts</h2>
        </div>
        {data.hiveStats.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500 text-center">No hives to show. <Link href="/apiaries" className="text-amber-600 hover:text-amber-700">Create an apiary</Link> to get started.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data.hiveStats.map((h: any) => (
              <Link key={h.id} href={`/hives/${h.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{h.name}</p>
                  <p className="text-xs text-zinc-500">{h.apiary_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">{h.inspectionCount}</p>
                  <p className="text-xs text-zinc-400">last: {h.lastInspection}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Inspections */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="p-5 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900">Recent Inspections</h2>
        </div>
        {data.recentInspections.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500 text-center">No inspections yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data.recentInspections.map((i: any) => (
              <Link key={i.id} href={`/hives/${i.hive_id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{i.date}</p>
                  <p className="text-xs text-zinc-500">{i.hive_name} ({i.apiary_name})</p>
                </div>
                <div className="flex items-center gap-3">
                  {i.queen_seen && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Queen ✓</span>}
                  {i.health_ok === false && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Issues</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

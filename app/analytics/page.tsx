import Link from 'next/link';

interface Apiary {
  id: string;
  name: string;
  notes?: string | null;
  created_at: string;
}

interface Hive {
  id: string;
  apiary_id: string;
  name: string;
  queen_breed?: string | null;
  queen_clipped: boolean;
  notes?: string | null;
  apiary_name?: string | null;
}

interface Inspection {
  id: string;
  hive_id: string;
  inspection_date: string;
  queen_seen: boolean;
  queen_colour?: string | null;
  queen_cells_found?: number | null;
  queen_cells_removed: boolean;
  eggs_seen: boolean;
  brood_pattern_ok: boolean;
  brood_frame_count?: number | null;
  store_frames?: number | null;
  room_frames?: number | null;
  health_ok: boolean;
  chalk_brood_suspected: boolean;
  efb_suspected: boolean;
  afb_suspected: boolean;
  varroa_level?: string | null;
  varroa_count?: number | null;
  temperament_score?: number | null;
  feed_litres_light_syrup?: number | null;
  feed_litres_heavy_syrup?: number | null;
  supers_change?: number | null;
  weather_temperature_c?: number | null;
  weather_condition?: string | null;
  notes?: string | null;
  hive_name?: string | null;
  apiary_name?: string | null;
}

interface HiveStat {
  id: string;
  name: string;
  apiary_name?: string | null;
  inspectionCount: number;
  lastInspection: string;
}

interface RecentInspection {
  id: string;
  hive_id: string;
  date: string;
  hive_name?: string | null;
  apiary_name?: string | null;
  queen_seen: boolean;
  health_ok: boolean;
}

async function getAnalyticsData(): Promise<{
  totalApiaries: number;
  totalHives: number;
  totalInspections: number;
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
}> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const [apiariesRes, hivesRes, inspectionsRes] = await Promise.all([
    fetch(`${base}/api/apiaries`, { cache: 'no-store' }),
    fetch(`${base}/api/hives`, { cache: 'no-store' }),
    fetch(`${base}/api/inspections`, { cache: 'no-store' }),
  ]);

  const apiaries: Apiary[] = apiariesRes.ok ? await apiariesRes.json() : [];
  const hives: Hive[] = hivesRes.ok ? await hivesRes.json() : [];
  const inspections: Inspection[] = inspectionsRes.ok ? await inspectionsRes.json() : [];

  // Compute stats
  const totalHives = hives.length;
  const totalInspections = inspections.length;
  const totalApiaries = apiaries.length;

  // Queen seen rate
  const queenSeenCount = inspections.filter((i: Inspection) => i.queen_seen).length;
  const queenSeenRate = totalInspections > 0 ? Math.round((queenSeenCount / totalInspections) * 100) : 0;

  // Eggs seen rate (proxy for healthy laying queen)
  const eggsSeenCount = inspections.filter((i: Inspection) => i.eggs_seen).length;
  const eggsRate = totalInspections > 0 ? Math.round((eggsSeenCount / totalInspections) * 100) : 0;

  // Health rate
  const healthOkCount = inspections.filter((i: Inspection) => i.health_ok).length;
  const healthRate = totalInspections > 0 ? Math.round((healthOkCount / totalInspections) * 100) : 0;

  // Varroa levels
  const varroaLow = inspections.filter((i: Inspection) => i.varroa_level === 'l').length;
  const varroaMed = inspections.filter((i: Inspection) => i.varroa_level === 'm').length;
  const varroaHigh = inspections.filter((i: Inspection) => i.varroa_level === 'h').length;

  // Average brood frames
  const broodCounts = inspections
    .map((i: Inspection) => i.brood_frame_count)
    .filter((n: number | null | undefined): n is number => n != null && n > 0);
  const avgBroodFrames = broodCounts.length > 0
    ? Math.round(broodCounts.reduce((a: number, b: number) => a + b, 0) / broodCounts.length * 10) / 10
    : null;

  // Average store frames
  const storeCounts = inspections
    .map((i: Inspection) => i.store_frames)
    .filter((n: number | null | undefined): n is number => n != null && n > 0);
  const avgStoreFrames = storeCounts.length > 0
    ? Math.round(storeCounts.reduce((a: number, b: number) => a + b, 0) / storeCounts.length * 10) / 10
    : null;

  // Average temperament
  const tempScores = inspections
    .map((i: Inspection) => i.temperament_score)
    .filter((n: number | null | undefined): n is number => n != null);
  const avgTemperament = tempScores.length > 0
    ? Math.round(tempScores.reduce((a: number, b: number) => a + b, 0) / tempScores.length * 10) / 10
    : null;

  // Per-hive inspection counts
  const hiveStats: HiveStat[] = hives.map((h: Hive) => {
    const hiveInspections = inspections.filter((i: Inspection) => i.hive_id === h.id);
    return {
      id: h.id,
      name: h.name,
      apiary_name: h.apiary_name,
      inspectionCount: hiveInspections.length,
      lastInspection: hiveInspections.length > 0
        ? new Date(hiveInspections[0].inspection_date).toLocaleDateString('en-GB')
        : '—',
    };
  }).sort((a: HiveStat, b: HiveStat) => b.inspectionCount - a.inspectionCount);

  // Recent inspections (last 10)
  const recentInspections: RecentInspection[] = inspections.slice(0, 10).map((i: Inspection) => ({
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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-primary/20 bg-surface p-5">
      <p className="text-xs text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-primary mt-1">{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Analytics</h1>

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
        <div className="border border-primary/20 bg-surface p-5">
          <h2 className="text-sm font-semibold text-primary mb-3">Varroa Levels</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Low</span>
              <span className="font-medium text-primary">{data.varroaLow}</span>
            </div>
            <div className="w-full bg-zinc-100 h-2">
              <div className="bg-accent h-2" style={{ width: `${data.totalInspections > 0 ? (data.varroaLow / data.totalInspections) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Medium</span>
              <span className="font-medium text-primary">{data.varroaMed}</span>
            </div>
            <div className="w-full bg-zinc-100 h-2">
              <div className="bg-accent h-2" style={{ width: `${data.totalInspections > 0 ? (data.varroaMed / data.totalInspections) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">High</span>
              <span className="font-medium text-primary">{data.varroaHigh}</span>
            </div>
            <div className="w-full bg-zinc-100 h-2">
              <div className="bg-primary/40 h-2" style={{ width: `${data.totalInspections > 0 ? (data.varroaHigh / data.totalInspections) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Averages */}
        <div className="border border-primary/20 bg-surface p-5">
          <h2 className="text-sm font-semibold text-primary mb-3">Averages</h2>
          <div className="space-y-3">
            {data.avgBroodFrames !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary">Avg Brood Frames</span>
                <span className="font-medium text-primary">{data.avgBroodFrames}</span>
              </div>
            )}
            {data.avgStoreFrames !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary">Avg Store Frames</span>
                <span className="font-medium text-primary">{data.avgStoreFrames}</span>
              </div>
            )}
            {data.avgTemperament !== null && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary">Avg Temperament</span>
                <span className="font-medium text-primary">{data.avgTemperament}/10</span>
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
        {data.hiveStats.length === 0 ? (
          <p className="p-5 text-sm text-secondary text-center">No hives to show. <Link href="/apiaries" className="text-accent hover:text-accent/80">Create an apiary</Link> to get started.</p>
        ) : (
          <div className="divide-y divide-primary/10">
            {data.hiveStats.map((h: HiveStat) => (
              <Link key={h.id} href={`/hives/${h.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-primary">{h.name}</p>
                  <p className="text-xs text-secondary">{h.apiary_name}</p>
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
        {data.recentInspections.length === 0 ? (
          <p className="p-5 text-sm text-secondary text-center">No inspections yet.</p>
        ) : (
          <div className="divide-y divide-primary/10">
            {data.recentInspections.map((i: RecentInspection) => (
              <Link key={i.id} href={`/hives/${i.hive_id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-primary">{i.date}</p>
                  <p className="text-xs text-secondary">{i.hive_name} ({i.apiary_name})</p>
                </div>
                <div className="flex items-center gap-3">
                  {i.queen_seen && <span className="text-xs bg-zinc-100 text-secondary px-2 py-0.5">Queen ✓</span>}
                  {i.health_ok === false && <span className="text-xs border border-primary/30 text-primary px-2 py-0.5">Issues</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

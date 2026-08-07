import Link from 'next/link';
import { Suspense } from 'react';

async function HiveList() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hives`);
  if (!res.ok) return <p className="text-primary font-medium">Failed to load hives</p>;
  const hives: Array<{ id: string; name: string; apiary_name: string; queen_breed?: string | null; queen_clipped?: boolean; inspection_count?: number }> = await res.json();

  if (hives.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary mb-4">No hives yet</p>
        <Link href="/apiaries" className="text-accent hover:text-accent/80 font-medium">
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
            {h.queen_clipped && (
              <span className="text-xs bg-zinc-100 text-secondary px-2 py-0.5">Clipped</span>
            )}
          </div>
          <p className="text-sm text-secondary mt-1">{h.apiary_name}</p>
          {h.queen_breed && <p className="text-xs text-secondary mt-1">Queen: {h.queen_breed}</p>}
          <p className="text-xs text-secondary mt-2">{h.inspection_count || 0} inspections</p>
        </Link>
      ))}
    </div>
  );
}

export default function HivesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Hives</h1>
        <Link href="/apiaries" className="text-sm text-secondary hover:text-primary/70">
          Manage apiaries →
        </Link>
      </div>
      <Suspense fallback={<p className="text-secondary">Loading…</p>}>
        <HiveList />
      </Suspense>
    </div>
  );
}

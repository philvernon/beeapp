import Link from 'next/link';
import { Suspense } from 'react';

async function HiveList() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hives`);
  if (!res.ok) return <p className="text-red-500">Failed to load hives</p>;
  const hives: Array<{ id: string; name: string; apiary_name: string; queen_breed?: string | null; queen_clipped?: boolean; inspection_count?: number }> = await res.json();

  if (hives.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 mb-4">No hives yet</p>
        <Link href="/apiaries" className="text-amber-600 hover:text-amber-700 font-medium">
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
          className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">{h.name}</h3>
            {h.queen_clipped && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Clipped</span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">{h.apiary_name}</p>
          {h.queen_breed && <p className="text-xs text-zinc-400 mt-1">Queen: {h.queen_breed}</p>}
          <p className="text-xs text-zinc-400 mt-2">{h.inspection_count || 0} inspections</p>
        </Link>
      ))}
    </div>
  );
}

export default function HivesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Hives</h1>
        <Link href="/apiaries" className="text-sm text-zinc-500 hover:text-zinc-700">
          Manage apiaries →
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <HiveList />
      </Suspense>
    </div>
  );
}

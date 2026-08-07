import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getApiary(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/apiaries/${id}`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ApiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiary = await getApiary(id);

  if (!apiary) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href="/apiaries" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to Apiaries
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/apiaries/${id}/edit`}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Edit
          </Link>
          <Link
            href={`/hives/new?apiary_id=${id}`}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            + New Hive
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{apiary.name}</h1>
        {apiary.notes && <p className="mt-1 text-sm text-zinc-500">{apiary.notes}</p>}
        <p className="mt-1 text-xs text-zinc-400">
          Created {new Date(apiary.created_at).toLocaleDateString()}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-zinc-900 mb-3">Hives ({apiary.hives?.length || 0})</h2>

      {(!apiary.hives || apiary.hives.length === 0) ? (
        <p className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-200 rounded-lg">
          No hives in this apiary yet.{' '}
          <Link href={`/hives/new?apiary_id=${id}`} className="text-amber-600 hover:text-amber-700 font-medium">
            Add one →
          </Link>
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {apiary.hives.map((hive: any) => (
            <Link
              key={hive.id}
              href={`/hives/${hive.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-amber-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-900">{hive.name}</span>
                {hive.queen_clipped && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Clipped</span>
                )}
              </div>
              {hive.queen_breed && <p className="text-sm text-zinc-500 mt-1">Queen: {hive.queen_breed}</p>}
              <p className="text-xs text-zinc-400 mt-2">{hive.inspection_count || 0} inspections</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

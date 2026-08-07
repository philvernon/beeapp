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
        <Link href="/apiaries" className="text-sm text-secondary hover:text-primary/70">
          ← Back to Apiaries
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/apiaries/${id}/edit`}
            className="border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary hover:bg-zinc-50"
          >
            Edit
          </Link>
          <Link
            href={`/hives/new?apiary_id=${id}`}
            className="bg-accent px-3 py-1.5 text-sm font-medium text-surface hover:bg-accent/90"
          >
            + New Hive
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{apiary.name}</h1>
        {apiary.notes && <p className="mt-1 text-sm text-secondary">{apiary.notes}</p>}
        <p className="mt-1 text-xs text-secondary">
          Created {new Date(apiary.created_at).toLocaleDateString()}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-primary mb-3">Hives ({apiary.hives?.length || 0})</h2>

      {(!apiary.hives || apiary.hives.length === 0) ? (
        <p className="text-secondary text-sm py-8 text-center border border-dashed border-primary/30">
          No hives in this apiary yet.{' '}
          <Link href={`/hives/new?apiary_id=${id}`} className="text-accent hover:text-accent/80 font-medium">
            Add one →
          </Link>
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {apiary.hives.map((hive: any) => (
            <Link
              key={hive.id}
              href={`/hives/${hive.id}`}
              className="block border border-primary/20 bg-surface p-4 hover:border-accent/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-primary">{hive.name}</span>
                {hive.queen_clipped && (
                  <span className="text-xs bg-zinc-100 text-secondary px-2 py-0.5">Clipped</span>
                )}
              </div>
              {hive.queen_breed && <p className="text-sm text-secondary mt-1">Queen: {hive.queen_breed}</p>}
              <p className="text-xs text-secondary mt-2">{hive.inspection_count || 0} inspections</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

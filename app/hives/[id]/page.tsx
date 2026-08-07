import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getHive(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hives/${id}`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getInspections(hiveId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/inspections?hive_id=${hiveId}`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function HiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hive = await getHive(id);

  if (!hive) notFound();

  const inspections = await getInspections(id);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/hives" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to Hives
        </Link>
        <div className="flex gap-2">
          <Link href={`/hives/${id}/edit`}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Edit Hive
          </Link>
          <Link href={`/hives/${id}/new-inspection`}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700">
            + New Inspection
          </Link>
        </div>
      </div>

      {/* Hive Info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{hive.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">{hive.apiary_name}</p>
          </div>
          {hive.queen_clipped && (
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">Queen Clipped</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100">
          {hive.queen_breed && (
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Queen Breed</p>
              <p className="text-sm font-medium mt-1">{hive.queen_breed}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Inspections</p>
            <p className="text-sm font-medium mt-1">{hive.inspection_count || 0}</p>
          </div>
          {hive.notes && (
            <div className="col-span-2">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Notes</p>
              <p className="text-sm mt-1">{hive.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspections */}
      <h2 className="text-lg font-semibold text-zinc-900 mb-3">Inspection History</h2>

      {inspections.length === 0 ? (
        <p className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-200 rounded-lg">
          No inspections recorded yet.{' '}
          <Link href={`/hives/${id}/new-inspection`} className="text-amber-600 hover:text-amber-700 font-medium">
            Record one →
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {inspections.map(( insp: any) => (
            <InspectionCard key={insp.id} inspection={insp} />
          ))}
        </div>
      )}
    </div>
  );
}

function InspectionCard({ inspection }: { inspection: any }) {
  const date = new Date(inspection.inspection_date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-zinc-900">{date}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          inspection.health_ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {inspection.health_ok ? 'Healthy' : 'Issues'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {inspection.queen_seen && (
          <div>
            <p className="text-xs text-zinc-400">Queen</p>
            <p className="font-medium">Seen {inspection.queen_colour ? `(${inspection.queen_colour})` : ''}</p>
          </div>
        )}
        {!inspection.queen_seen && (
          <div>
            <p className="text-xs text-zinc-400">Queen</p>
            <p className="font-medium text-red-600">Not seen</p>
          </div>
        )}
        {inspection.eggs_seen !== null && (
          <div>
            <p className="text-xs text-zinc-400">Eggs</p>
            <p className={`font-medium ${inspection.eggs_seen ? 'text-green-600' : 'text-red-600'}`}>
              {inspection.eggs_seen ? 'Yes' : 'No'}
            </p>
          </div>
        )}
        {inspection.brood_frame_count !== null && (
          <div>
            <p className="text-xs text-zinc-400">Brood Frames</p>
            <p className="font-medium">{inspection.brood_frame_count}</p>
          </div>
        )}
        {inspection.store_frames !== null && (
          <div>
            <p className="text-xs text-zinc-400">Store Frames</p>
            <p className="font-medium">{inspection.store_frames}</p>
          </div>
        )}
        {inspection.room_frames !== null && (
          <div>
            <p className="text-xs text-zinc-400">Room Frames</p>
            <p className="font-medium">{inspection.room_frames}</p>
          </div>
        )}
        {inspection.varroa_level && (
          <div>
            <p className="text-xs text-zinc-400">Varroa</p>
            <p className={`font-medium ${
              inspection.varroa_level === 'l' ? 'text-green-600' :
              inspection.varroa_level === 'm' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {inspection.varroa_level.toUpperCase()}
              {inspection.varroa_count !== null && ` (${inspection.varroa_count})`}
            </p>
          </div>
        )}
        {inspection.temperament_score !== null && (
          <div>
            <p className="text-xs text-zinc-400">Temperament</p>
            <p className="font-medium">{inspection.temperament_score}/10</p>
          </div>
        )}
      </div>

      {inspection.notes && (
        <p className="mt-3 pt-3 border-t border-zinc-100 text-sm text-zinc-500 italic">{inspection.notes}</p>
      )}
    </div>
  );
}

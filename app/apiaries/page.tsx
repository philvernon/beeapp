import { clear } from 'console';
import Link from 'next/link';
import { Suspense } from 'react';

async function ApiaryList() {
	const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/apiaries`);
	console.log(res);
	if (!res.ok) return <p className="text-red-500">Failed to load apiaries</p>;
	const apiaries: Array<{ id: string; name: string; notes?: string | null; created_at: string }> = await res.json();

	if (apiaries.length === 0) {
		return (
			<div className="text-center py-16">
				hi
				<p className="text-zinc-500 mb-4">No apiaries yet</p>
				<Link href="/apiaries/new" className="text-amber-600 hover:text-amber-700 font-medium">
					Create your first apiary →
				</Link>
			</div>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{apiaries.map((a) => (
				<Link
					key={a.id}
					href={`/apiaries/${a.id}`}
					className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm hover:border-amber-300 hover:shadow-md transition-all"
				>
					<h3 className="text-lg font-semibold text-zinc-900">{a.name}</h3>
					{a.notes && <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{a.notes}</p>}
					<p className="mt-3 text-xs text-zinc-400">
						Created {new Date(a.created_at).toLocaleDateString()}
					</p>
				</Link>
			))}
		</div>
	);
}

export default function ApiariesPage() {
	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-zinc-900">Apiaries</h1>
				<Link
					href="/apiaries/new"
					className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
				>
					+ New Apiary
				</Link>
			</div>
			<Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
				<ApiaryList />
			</Suspense>
		</div>
	);
}

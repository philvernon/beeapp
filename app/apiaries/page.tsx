import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

import { getApiaries } from "@/lib/data";

export async function ApiaryList() {
	const apiaries = await getApiaries();

	if (apiaries.length === 0) {
		return (
			<div className="text-center py-16">
				<p className="text-secondary mb-4">No apiaries yet</p>
				<Link
					href="/apiaries/new"
					className="text-accent hover:text-accent/80 font-medium"
				>
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
					className="block border border-primary/20 bg-surface p-5 hover:border-accent/50 transition-all"
				>
					<h3 className="text-lg font-semibold text-primary">{a.name}</h3>
					{a.notes && (
						<p className="mt-1 text-sm text-secondary line-clamp-2">
							{a.notes}
						</p>
					)}
					<p className="mt-3 text-xs text-secondary">
						Created {new Date(a.createdAt).toLocaleDateString()}
					</p>
				</Link>
			))}
		</div>
	);
}

export default async function ApiariesPage() {
	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-primary">Apiaries</h1>
				<Link
					href="/apiaries/new"
					className="inline-flex items-center bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-accent/90 transition-colors"
				>
					+ New Apiary
				</Link>
			</div>
			<Suspense fallback={<p className="text-secondary">Loading…</p>}>
				<ApiaryList />
			</Suspense>
		</div>
	);
}

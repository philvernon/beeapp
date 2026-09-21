import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

import { getApiaries } from "@/lib/data";

export async function ApiaryList() {
	const apiaries = await getApiaries();

	if (apiaries.length === 0) {
		return (
			<div className="text-center py-16">
				<p className="text-muted-foreground mb-4">No apiaries yet</p>
				<Link
					href="/apiaries/new"
					className="text-primary hover:underline font-medium"
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
					className="block"
				>
					<Card className="group hover:shadow-sm transition-shadow">
						<CardHeader>
							<CardTitle>{a.name}</CardTitle>
						</CardHeader>
						<CardContent>
							{a.notes && (
								<p className="mt-1 text-xs text-muted-foreground line-clamp-2">
									{a.notes}
								</p>
							)}
							<p className="mt-3 text-xs text-muted-foreground">
								Created {new Date(a.createdAt).toLocaleDateString()}
							</p>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

export default async function ApiariesPage() {
	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-foreground">Apiaries</h1>
				<ButtonLink href="/apiaries/new" size="sm">+ New Apiary</ButtonLink>
			</div>
			<Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
				<ApiaryList />
			</Suspense>
		</div>
	);
}

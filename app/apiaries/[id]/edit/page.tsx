"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiaryUpdate } from "@/lib/schema";
import { safeJsonFetch, getErrorMessage } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditApiaryPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const { id } = React.use(params);
	const [name, setName] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			const result = await safeJsonFetch(`/api/apiaries/${id}`);
			if (cancelled) return;

			if (result.error) {
				setFetchError(result.error);
				return;
			}

			const data = result.data as Record<string, unknown> | null;
			if (data?.error) {
				router.push("/apiaries");
				return;
			}
			if (data && typeof data === "object") {
				setName((data.name as string) || "");
				setNotes((data.notes as string) || "");
			}
			setInitialized(true);
		}

		load();
		return () => { cancelled = true; };
	}, [id, router]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const validated = ApiaryUpdate.safeParse({
				name,
				notes: notes || undefined,
			});
			if (!validated.success) {
				setError(validated.error.issues.map((i) => i.message).join("; "));
				setLoading(false);
				return;
			}

			const res = await fetch(`/api/apiaries/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validated.data),
			});

			if (!res.ok) {
				throw new Error(await getErrorMessage(res, "Failed to update"));
			}

			router.push(`/apiaries/${id}`);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-lg">
			<Link href={`/apiaries/${id}`} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
				← Back to Apiary
			</Link>
			<h1 className="text-2xl font-bold text-foreground mb-6">Edit Apiary</h1>

			{fetchError && (
				<div className="mb-4 border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive rounded-none">
					Failed to load data: {fetchError}
				</div>
			)}

			{error && (
				<div className="mb-4 border border-border bg-muted px-4 py-3 text-sm text-foreground rounded-none">
					{error}
				</div>
			)}

			{initialized && !fetchError && (
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
							Name *
						</label>
						<Input
							id="name"
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
							Notes
						</label>
						<textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="w-full border border-input bg-transparent px-2.5 py-1.5 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px]"
						/>
					</div>
					<div className="flex gap-3 pt-2">
						<Button type="submit" disabled={loading}>
							{loading ? "Saving…" : "Save Changes"}
						</Button>
						<Link href={`/apiaries/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors">
							Cancel
						</Link>
					</div>
				</form>
			)}
		</div>
	);
}

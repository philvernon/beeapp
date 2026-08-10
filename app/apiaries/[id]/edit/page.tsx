"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiaryUpdate } from "@/lib/schema";
import { safeJsonFetch, getErrorMessage } from "@/lib/fetch";

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
		return () => {
			cancelled = true;
		};
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
			<Link
				href={`/apiaries/${id}`}
				className="text-sm text-secondary hover:text-primary/70 mb-4 inline-block"
			>
				← Back to Apiary
			</Link>
			<h1 className="text-2xl font-bold text-primary mb-6">Edit Apiary</h1>

			{fetchError && (
				<div className="mb-4 border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
					Failed to load data: {fetchError}
				</div>
			)}

			{error && (
				<div className="mb-4 border border-primary/30 bg-zinc-50 px-4 py-3 text-sm text-primary">
					{error}
				</div>
			)}

			{initialized && !fetchError && (
				<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-primary mb-1"
					>
						Name *
					</label>
					<input
						id="name"
						type="text"
						required
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full border border-primary/30 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-surface"
					/>
				</div>
				<div>
					<label
						htmlFor="notes"
						className="block text-sm font-medium text-primary mb-1"
					>
						Notes
					</label>
					<textarea
						id="notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={3}
						className="w-full border border-primary/30 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-surface"
					/>
				</div>
				<div className="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={loading}
						className="bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-accent/90 disabled:opacity-50 transition-colors"
					>
						{loading ? "Saving…" : "Save Changes"}
					</button>
					<Link
						href={`/apiaries/${id}`}
						className="text-sm text-secondary hover:text-primary/70 py-2"
					>
						Cancel
					</Link>
				</div>
			</form>
			)}
		</div>
	);
}

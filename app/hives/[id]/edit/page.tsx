"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditHivePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const { id } = React.use(params);

	const [apiaries, setApiaries] = useState<Array<{ id: string; name: string }>>(
		[],
	);
	const [apiaryId, setApiaryId] = useState("");
	const [name, setName] = useState("");
	const [queenBreed, setQueenBreed] = useState("");
	const [queenClipped, setQueenClipped] = useState(false);
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		Promise.all([
			fetch("/api/apiaries")
				.then((r) => r.json())
				.then(setApiaries),
			fetch(`/api/hives/${id}`)
				.then((r) => r.json())
				.then((data) => {
					if (data?.error) {
						router.push("/hives");
						return;
					}
					setApiaryId(data.apiary_id);
					setName(data.name);
					setQueenBreed(data.queen_breed || "");
					setQueenClipped(data.queen_clipped ?? false);
					setNotes(data.notes || "");
				}),
		]).catch(() => {});
	}, [id, router]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch(`/api/hives/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apiary_id: apiaryId,
					name,
					queen_breed: queenBreed || null,
					queen_clipped: queenClipped,
					notes: notes || undefined,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update");
			}

			router.push(`/hives/${id}`);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-lg">
			<Link
				href={`/hives/${id}`}
				className="text-sm text-secondary hover:text-primary/70 mb-4 inline-block"
			>
				← Back to Hive
			</Link>
			<h1 className="text-2xl font-bold text-primary mb-6">Edit Hive</h1>

			{error && (
				<div className="mb-4 border border-primary/30 bg-zinc-50 px-4 py-3 text-sm text-primary">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="apiary"
						className="block text-sm font-medium text-primary mb-1"
					>
						Apiary *
					</label>
					<select
						id="apiary"
						required
						value={apiaryId}
						onChange={(e) => setApiaryId(e.target.value)}
						className="w-full border border-primary/30 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-surface"
					>
						<option value="">Select apiary…</option>
						{apiaries.map((a) => (
							<option key={a.id} value={a.id}>
								{a.name}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-primary mb-1"
					>
						Hive Name *
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
						htmlFor="queenBreed"
						className="block text-sm font-medium text-primary mb-1"
					>
						Queen Breed
					</label>
					<input
						id="queenBreed"
						type="text"
						value={queenBreed}
						onChange={(e) => setQueenBreed(e.target.value)}
						className="w-full border border-primary/30 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-surface"
					/>
				</div>

				<div className="flex items-center gap-2">
					<input
						id="queenClipped"
						type="checkbox"
						checked={queenClipped}
						onChange={(e) => setQueenClipped(e.target.checked)}
						className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
					/>
					<label htmlFor="queenClipped" className="text-sm text-primary">
						Queen Clipped?
					</label>
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
						href={`/hives/${id}`}
						className="text-sm text-secondary hover:text-primary/70 py-2"
					>
						Cancel
					</Link>
				</div>
			</form>
		</div>
	);
}

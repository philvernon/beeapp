"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiaryInsert } from "@/lib/schema";
import { getErrorMessage } from "@/lib/fetch";

export default function NewApiaryPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const validated = ApiaryInsert.safeParse({
				name,
				notes: notes || undefined,
			});
			if (!validated.success) {
				setError(validated.error.issues.map((i) => i.message).join("; "));
				setLoading(false);
				return;
			}

			const res = await fetch("/api/apiaries", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validated.data),
			});

			if (!res.ok) {
				throw new Error(await getErrorMessage(res, "Failed to create apiary"));
			}

			router.push("/apiaries");
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-lg">
			<Link
				href="/apiaries"
				className="text-sm text-secondary hover:text-primary/70 mb-4 inline-block"
			>
				← Back to Apiaries
			</Link>
			<h1 className="text-2xl font-bold text-primary mb-6">New Apiary</h1>

			{error && (
				<div className="mb-4 border border-primary/30 bg-zinc-50 px-4 py-3 text-sm text-primary">
					{error}
				</div>
			)}

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
						placeholder="e.g. Garden Apiary"
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
						placeholder="Optional notes…"
					/>
				</div>

				<div className="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={loading}
						className="bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-accent/90 disabled:opacity-50 transition-colors"
					>
						{loading ? "Creating…" : "Create Apiary"}
					</button>
					<Link
						href="/apiaries"
						className="text-sm text-secondary hover:text-primary/70 py-2"
					>
						Cancel
					</Link>
				</div>
			</form>
		</div>
	);
}

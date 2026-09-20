"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { HiveInsert } from "@/lib/schema";
import { safeJsonFetch, getErrorMessage } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";


function NewHiveForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const preselectedApiary = searchParams.get("apiary_id");

	const [apiaries, setApiaries] = useState<Array<{ id: string; name: string }>>([]);
	const [apiaryId, setApiaryId] = useState(preselectedApiary || "");
	const [name, setName] = useState("");
	const [queenBreed, setQueenBreed] = useState("");
	const [queenClipped, setQueenClipped] = useState(false);
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			const result = await safeJsonFetch("/api/apiaries");
			if (cancelled) return;

			if (result.error) {
				setFetchError(result.error);
				return;
			}

			const data = result.data as Array<{ id: string; name: string }>;
			setApiaries(data);
			setInitialized(true);
		}

		load();
		return () => { cancelled = true; };
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!apiaryId) {
			setError("Please select an apiary");
			return;
		}
		setLoading(true);

		try {
			const validated = HiveInsert.safeParse({
				apiaryId,
				name,
				queenBreed: queenBreed || null,
				queenClipped,
				notes: notes || undefined,
			});
			if (!validated.success) {
				setError(validated.error.issues.map((i) => i.message).join("; "));
				setLoading(false);
				return;
			}

			const res = await fetch("/api/hives", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validated.data),
			});

			if (!res.ok) {
				throw new Error(await getErrorMessage(res, "Failed to create hive"));
			}

			router.push(`/apiaries/${apiaryId}`);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-lg">
			<Link href="/hives" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
				← Back to Hives
			</Link>
			<h1 className="text-2xl font-bold text-foreground mb-6">New Hive</h1>

			{fetchError && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>Failed to load data: {fetchError}</AlertDescription>
				</Alert>
			)}

			{error && (
				<Alert className="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{initialized && !fetchError && (
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="apiary" className="block text-sm font-medium text-foreground mb-1">
							Apiary *
						</label>
						<Select value={apiaryId} onValueChange={(v) => setApiaryId(v || "")} required>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select apiary…" />
							</SelectTrigger>
							<SelectContent>
								{apiaries.map((a) => (
									<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
							Hive Name *
						</label>
						<Input
							id="name"
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Hive 1"
						/>
					</div>

					<div>
						<label htmlFor="queenBreed" className="block text-sm font-medium text-foreground mb-1">
							Queen Breed
						</label>
						<Input
							id="queenBreed"
							type="text"
							value={queenBreed}
							onChange={(e) => setQueenBreed(e.target.value)}
							placeholder="e.g. Italian, Carniolan"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="queenClipped"
							checked={queenClipped}
							onCheckedChange={(c) => setQueenClipped(!!c)}
						/>
						<label htmlFor="queenClipped" className="text-sm text-foreground">
							Queen Clipped?
						</label>
					</div>

					<div>
						<label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
							Notes
						</label>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>

					<div className="flex gap-3 pt-2">
						<Button type="submit" disabled={loading}>
							{loading ? "Creating…" : "Create Hive"}
						</Button>
						<Link href="/hives" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors">
							Cancel
						</Link>
					</div>
				</form>
			)}
		</div>
	);
}

export default function NewHivePage() {
	return (
		<Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
			<NewHiveForm />
		</Suspense>
	);
}

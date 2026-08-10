"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	InspectionInsert,
	queenColourLabels,
	varroaLevelLabels,
	weatherConditionLabels,
} from "@/lib/schema";

export default function NewInspectionPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const { id } = React.use(params);

	const [hiveName, setHiveName] = useState("");
	const [date, setDate] = useState(
		() => new Date().toISOString().split("T")[0],
	);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Inspection fields
	const [queenSeen, setQueenSeen] = useState(false);
	const [queenColour, setQueenColour] = useState<string>("");
	const [queenCellsFound, setQueenCellsFound] = useState<number | "">("");
	const [queenCellsRemoved, setQueenCellsRemoved] = useState(false);
	const [eggsSeen, setEggsSeen] = useState(false);
	const [broodPatternOk, setBroodPatternOk] = useState(true);
	const [broodFrameCount, setBroodFrameCount] = useState<number | "">("");
	const [storeFrames, setStoreFrames] = useState<number | "">("");
	const [roomFrames, setRoomFrames] = useState<number | "">("");
	const [healthOk, setHealthOk] = useState(true);
	const [chalkBrood, setChalkBrood] = useState(false);
	const [efbSuspected, setEfbSuspected] = useState(false);
	const [afbSuspected, setAfbSuspected] = useState(false);
	const [varroaLevel, setVarroaLevel] = useState<string>("");
	const [varroaCount, setVarroaCount] = useState<number | "">("");
	const [temperament, setTemperament] = useState<number | "">("");
	const [feedLight, setFeedLight] = useState<number | "">("");
	const [feedHeavy, setFeedHeavy] = useState<number | "">("");
	const [supersChange, setSupersChange] = useState<number | "">("");
	const [weatherTemp, setWeatherTemp] = useState<number | "">("");
	const [weatherCondition, setWeatherCondition] = useState<string>("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		fetch(`/api/hives/${id}`)
			.then((r) => r.json())
			.then((data) => {
				if (data?.name) setHiveName(data.name);
				else router.push("/hives");
			})
			.catch(() => router.push("/hives"));
	}, [id, router]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const body = {
			hiveId: id,
			inspectionDate: date,
			queenSeen,
			queenColour: queenColour || null,
			queenCellsFound: queenCellsFound === "" ? null : queenCellsFound,
			queenCellsRemoved,
			eggsSeen,
			broodPatternOk,
			broodFrameCount: broodFrameCount === "" ? null : broodFrameCount,
			storeFrames: storeFrames === "" ? null : storeFrames,
			roomFrames: roomFrames === "" ? null : roomFrames,
			healthOk,
			chalkBroodSuspected: chalkBrood,
			efbSuspected,
			afbSuspected,
			varroaLevel: varroaLevel || null,
			varroaCount: varroaCount === "" ? null : varroaCount,
			temperamentScore: temperament === "" ? null : temperament,
			feedLitresLightSyrup: feedLight === "" ? null : Number(feedLight),
			feedLitresHeavySyrup: feedHeavy === "" ? null : Number(feedHeavy),
			supersChange: supersChange === "" ? null : Number(supersChange),
			weatherTemperatureC: weatherTemp === "" ? null : Number(weatherTemp),
			weatherCondition: weatherCondition || null,
			notes: notes || undefined,
		};

		try {
			const validated = InspectionInsert.safeParse(body);
			if (!validated.success) {
				setError(
					validated.error.issues
						.map((i) => `${i.path.join(".")}: ${i.message}`)
						.join("; "),
				);
				setLoading(false);
				return;
			}

			const res = await fetch("/api/inspections", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validated.data),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(
					data.error ||
						data.details?.[0]?.message ||
						"Failed to save inspection",
				);
			}

			router.push(`/hives/${id}`);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}

	const inputClass =
		"w-full border border-primary/30 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-surface";
	const labelClass = "block text-sm font-medium text-primary mb-1";
	const fieldsetClass = "border border-primary/20 p-4 space-y-3";

	return (
		<div className="max-w-2xl">
			<Link
				href={`/hives/${id}`}
				className="text-sm text-secondary hover:text-primary/70 mb-4 inline-block"
			>
				← Back to {hiveName || "Hive"}
			</Link>
			<h1 className="text-2xl font-bold text-primary mb-6">
				New Inspection — {hiveName}
			</h1>

			{error && (
				<div className="mb-4 border border-primary/30 bg-zinc-50 px-4 py-3 text-sm text-primary">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Date */}
				<div>
					<label htmlFor="date" className={labelClass}>
						Inspection Date *
					</label>
					<input
						id="date"
						type="date"
						required
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className={inputClass}
					/>
				</div>

				{/* Queen */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						👑 Queen
					</legend>
					<div className="flex items-center gap-2">
						<input
							id="queenSeen"
							type="checkbox"
							checked={queenSeen}
							onChange={(e) => setQueenSeen(e.target.checked)}
							className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
						/>
						<label htmlFor="queenSeen" className="text-sm text-primary">
							Queen seen this inspection
						</label>
					</div>
					{queenSeen && (
						<div className="ml-6 space-y-3">
							<div>
								<label className={labelClass}>Queen Colour</label>
								<select
									value={queenColour}
									onChange={(e) => setQueenColour(e.target.value)}
									className={inputClass}
								>
									<option value="">Select…</option>
									{Object.entries(queenColourLabels).map(([k, v]) => (
										<option key={k} value={k}>
											{v} ({k})
										</option>
									))}
								</select>
							</div>
						</div>
					)}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Queen Cells Found</label>
							<input
								type="number"
								min="0"
								value={queenCellsFound}
								onChange={(e) =>
									setQueenCellsFound(
										e.target.value === "" ? "" : parseInt(e.target.value),
									)
								}
								placeholder="—"
								className={inputClass}
							/>
						</div>
						<div className="flex items-center pt-6">
							<input
								id="queenCellsRemoved"
								type="checkbox"
								checked={queenCellsRemoved}
								onChange={(e) => setQueenCellsRemoved(e.target.checked)}
								className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
							/>
							<label
								htmlFor="queenCellsRemoved"
								className="ml-2 text-sm text-primary"
							>
								Cells removed
							</label>
						</div>
					</div>
				</fieldset>

				{/* Brood */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						🐝 Brood
					</legend>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<input
								id="eggsSeen"
								type="checkbox"
								checked={eggsSeen}
								onChange={(e) => setEggsSeen(e.target.checked)}
								className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
							/>
							<label htmlFor="eggsSeen" className="text-sm text-primary">
								Eggs seen
							</label>
						</div>
						<div className="flex items-center gap-2">
							<input
								id="broodOk"
								type="checkbox"
								checked={broodPatternOk}
								onChange={(e) => setBroodPatternOk(e.target.checked)}
								className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
							/>
							<label htmlFor="broodOk" className="text-sm text-primary">
								Brood pattern OK
							</label>
						</div>
					</div>
					<div>
						<label className={labelClass}>Brood Frame Count</label>
						<input
							type="number"
							min="0"
							value={broodFrameCount}
							onChange={(e) =>
								setBroodFrameCount(
									e.target.value === "" ? "" : parseInt(e.target.value),
								)
							}
							placeholder="—"
							className={inputClass}
						/>
					</div>
				</fieldset>

				{/* Stores & Space */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						🍯 Stores & Space
					</legend>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Store Frames (honey/pollen)</label>
							<input
								type="number"
								min="0"
								value={storeFrames}
								onChange={(e) =>
									setStoreFrames(
										e.target.value === "" ? "" : parseInt(e.target.value),
									)
								}
								placeholder="—"
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>
								Room Frames (available space)
							</label>
							<input
								type="number"
								min="0"
								value={roomFrames}
								onChange={(e) =>
									setRoomFrames(
										e.target.value === "" ? "" : parseInt(e.target.value),
									)
								}
								placeholder="—"
								className={inputClass}
							/>
						</div>
					</div>
				</fieldset>

				{/* Health */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						🏥 Health
					</legend>
					<div className="flex items-center gap-2 mb-3">
						<input
							id="healthOk"
							type="checkbox"
							checked={healthOk}
							onChange={(e) => setHealthOk(e.target.checked)}
							className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
						/>
						<label htmlFor="healthOk" className="text-sm text-primary">
							No disease signs
						</label>
					</div>
					{!healthOk && (
						<div className="ml-6 space-y-2">
							<p className="text-xs text-secondary mb-1">Disease flags:</p>
							<div className="flex gap-4">
								<label className="flex items-center gap-1.5 text-sm text-primary">
									<input
										type="checkbox"
										checked={chalkBrood}
										onChange={(e) => setChalkBrood(e.target.checked)}
										className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
									/>
									Chalk Brood
								</label>
								<label className="flex items-center gap-1.5 text-sm text-primary">
									<input
										type="checkbox"
										checked={efbSuspected}
										onChange={(e) => setEfbSuspected(e.target.checked)}
										className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
									/>
									EFB
								</label>
								<label className="flex items-center gap-1.5 text-sm text-primary">
									<input
										type="checkbox"
										checked={afbSuspected}
										onChange={(e) => setAfbSuspected(e.target.checked)}
										className="h-4 w-4 border-primary/30 accent-accent focus:ring-accent"
									/>
									AFB
								</label>
							</div>
						</div>
					)}
				</fieldset>

				{/* Varroa */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						🔬 Varroa
					</legend>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Level</label>
							<select
								value={varroaLevel}
								onChange={(e) => setVarroaLevel(e.target.value)}
								className={inputClass}
							>
								<option value="">Select…</option>
								{Object.entries(varroaLevelLabels).map(([k, v]) => (
									<option key={k} value={k}>
										{v}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className={labelClass}>Count (optional)</label>
							<input
								type="number"
								min="0"
								value={varroaCount}
								onChange={(e) =>
									setVarroaCount(
										e.target.value === "" ? "" : parseInt(e.target.value),
									)
								}
								placeholder="—"
								className={inputClass}
							/>
						</div>
					</div>
				</fieldset>

				{/* Temperament */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						🌡️ Temperament
					</legend>
					<div>
						<label className={labelClass}>
							Docility Score (1 = aggressive, 10 = docile)
						</label>
						<input
							type="number"
							min="1"
							max="10"
							value={temperament}
							onChange={(e) =>
								setTemperament(
									e.target.value === "" ? "" : parseInt(e.target.value),
								)
							}
							placeholder="—"
							className={inputClass}
						/>
					</div>
				</fieldset>

				{/* Feed */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						🍯 Feeding
					</legend>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Light Syrup (litres)</label>
							<input
								type="number"
								step="0.25"
								min="0"
								value={feedLight}
								onChange={(e) =>
									setFeedLight(
										e.target.value === "" ? "" : parseFloat(e.target.value),
									)
								}
								placeholder="—"
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>Heavy Syrup (litres)</label>
							<input
								type="number"
								step="0.25"
								min="0"
								value={feedHeavy}
								onChange={(e) =>
									setFeedHeavy(
										e.target.value === "" ? "" : parseFloat(e.target.value),
									)
								}
								placeholder="—"
								className={inputClass}
							/>
						</div>
					</div>
				</fieldset>

				{/* Supers */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						📦 Supers
					</legend>
					<div>
						<label className={labelClass}>
							Supers Change (positive = added, negative = removed)
						</label>
						<input
							type="number"
							step="0.5"
							value={supersChange}
							onChange={(e) =>
								setSupersChange(
									e.target.value === "" ? "" : parseFloat(e.target.value),
								)
							}
							placeholder="—"
							className={inputClass}
						/>
					</div>
				</fieldset>

				{/* Weather */}
				<fieldset className={fieldsetClass}>
					<legend className="text-sm font-semibold text-primary mb-2">
						🌤️ Weather
					</legend>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Temperature (°C)</label>
							<input
								type="number"
								step="0.1"
								value={weatherTemp}
								onChange={(e) =>
									setWeatherTemp(
										e.target.value === "" ? "" : parseFloat(e.target.value),
									)
								}
								placeholder="—"
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>Condition</label>
							<select
								value={weatherCondition}
								onChange={(e) => setWeatherCondition(e.target.value)}
								className={inputClass}
							>
								<option value="">Select…</option>
								{Object.entries(weatherConditionLabels).map(([k, v]) => (
									<option key={k} value={k}>
										{v}
									</option>
								))}
							</select>
						</div>
					</div>
				</fieldset>

				{/* Notes */}
				<div>
					<label htmlFor="notes" className={labelClass}>
						Notes
					</label>
					<textarea
						id="notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={3}
						className={inputClass}
						placeholder="Any additional observations…"
					/>
				</div>

				{/* Submit */}
				<div className="flex gap-3 pt-2">
					<button
						type="submit"
						disabled={loading}
						className="bg-accent px-6 py-2 text-sm font-medium text-surface hover:bg-accent/90 disabled:opacity-50 transition-colors"
					>
						{loading ? "Saving…" : "Save Inspection"}
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

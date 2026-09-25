"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiveUpdate } from "@/lib/schema";
import { safeJsonFetch, getErrorMessage } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [apiariesResult, hiveResult] = await Promise.all([
        safeJsonFetch("/api/apiaries"),
        safeJsonFetch(`/api/hives/${id}`),
      ]);

      if (cancelled) return;

      if (apiariesResult.error) {
        setFetchError(apiariesResult.error);
        return;
      }

      if (hiveResult.error) {
        setFetchError(hiveResult.error);
        return;
      }

      const apiaries = apiariesResult.data as Array<{
        id: string;
        name: string;
      }>;
      const hive = hiveResult.data as Record<string, unknown> | null;

      setApiaries(apiaries);
      if (hive?.error) {
        router.push("/hives");
        return;
      }
      if (hive && typeof hive === "object") {
        setApiaryId((hive.apiaryId as string) || "");
        setName((hive.name as string) || "");
        setQueenBreed((hive.queenBreed as string) || "");
        setQueenClipped((hive.queenClipped as boolean) ?? false);
        setNotes((hive.notes as string) || "");
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
      const validated = HiveUpdate.safeParse({
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

      const res = await fetch(`/api/hives/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to update"));
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
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← Back to Hive
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Edit Hive</h1>

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
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="apiary">
                Apiary <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={apiaryId}
                onValueChange={(v) => setApiaryId(v || "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select apiary…" />
                </SelectTrigger>
                <SelectContent>
                  {apiaries.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">
                Hive Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="queenBreed">Queen Breed</FieldLabel>
              <Input
                id="queenBreed"
                type="text"
                value={queenBreed}
                onChange={(e) => setQueenBreed(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="queenClipped">Queen Clipped?</FieldLabel>
              <Checkbox
                id="queenClipped"
                checked={queenClipped}
                onCheckedChange={(c) => setQueenClipped(!!c)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </Button>
            <Link
              href={`/hives/${id}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

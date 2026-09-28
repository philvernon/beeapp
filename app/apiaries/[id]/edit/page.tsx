"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiaryUpdate } from "@/lib/schema";
import { parseJsonFetch, getErrorMessage } from "@/lib/fetch";
import { ApiaryDetailSchema } from "@/lib/api-contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

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
      const result = await parseJsonFetch(
        `/api/apiaries/${id}`,
        ApiaryDetailSchema,
      );
      if (cancelled) return;

      if (result.error) {
        setFetchError(result.error);
        return;
      }

      if (!result.data) {
        router.push("/apiaries");
        return;
      }

      setName(result.data.name);
      setNotes(result.data.notes || "");
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
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← Back to Apiary
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Edit Apiary</h1>

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
              <FieldLabel htmlFor="name">
                Name <span className="text-destructive">*</span>
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
              href={`/apiaries/${id}`}
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

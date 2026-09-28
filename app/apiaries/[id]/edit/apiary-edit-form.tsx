"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiaryUpdate } from "@/lib/schema";
import { getErrorMessage } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function ApiaryEditForm({
  apiaryId,
  initialName,
  initialNotes,
}: {
  apiaryId: string;
  initialName: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      const res = await fetch(`/api/apiaries/${apiaryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to update"));
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
      <Link
        href={`/apiaries/${apiaryId}`}
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← Back to Apiary
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Edit Apiary</h1>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            href={`/apiaries/${apiaryId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

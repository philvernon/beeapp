"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ApiaryRow } from "@/lib/schema";
import { HiveInsert } from "@/lib/schema";
import { getErrorMessage } from "@/lib/fetch";
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

export function NewHiveForm({
  apiaries,
  preselectedApiaryId,
}: {
  apiaries: Pick<ApiaryRow, "id" | "name">[];
  preselectedApiaryId: string | null;
}) {
  const router = useRouter();
  const [apiaryId, setApiaryId] = useState(preselectedApiaryId || "");
  const [name, setName] = useState("");
  const [queenBreed, setQueenBreed] = useState("");
  const [queenClipped, setQueenClipped] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      <Link
        href="/hives"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← Back to Hives
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">New Hive</h1>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="apiary">
              Apiary <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={apiaryId}
              onValueChange={(v) => setApiaryId(v || "")}
              required
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
              placeholder="e.g. Hive 1"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="queenBreed">Queen Breed</FieldLabel>
            <Input
              id="queenBreed"
              type="text"
              value={queenBreed}
              onChange={(e) => setQueenBreed(e.target.value)}
              placeholder="e.g. Italian, Carniolan"
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
            {loading ? "Creating…" : "Create Hive"}
          </Button>
          <Link
            href="/hives"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

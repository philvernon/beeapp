"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { safeJsonFetch } from "@/lib/fetch";
import { InspectionForm } from "./inspection-form";
import { toast, Toaster } from "@/components/ui/toast";

export default function NewInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);

  const [hiveName, setHiveName] = React.useState("");
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await safeJsonFetch(`/api/hives/${id}`);
      if (cancelled) return;

      if (result.error) {
        setFetchError(result.error);
        return;
      }

      const data = result.data as Record<string, unknown> | null;
      if (data && typeof data === "object" && (data.name as string)) {
        setHiveName(data.name as string);
      } else {
        router.push("/hives");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  React.useEffect(() => {
    if (hiveName) {
      toast.add({
        type: "success",
        title: "Hive scanned",
        description: `Opening inspection for ${hiveName}`,
      });
    }
  }, [hiveName]);

  return (
    <div className="flex min-h-0 flex-col max-w-2xl flex-1">
      <Toaster />
      <Link
        href={`/hives/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
      >
        ← Back to {hiveName || "Hive"}
      </Link>
      <h1 className="text-base font-bold text-foreground mb-1">
        New Inspection — {hiveName}
      </h1>

      {fetchError && (
        <div className="mb-4 border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load data: {fetchError}
        </div>
      )}

      {!fetchError && <InspectionForm hiveId={id} />}
    </div>
  );
}

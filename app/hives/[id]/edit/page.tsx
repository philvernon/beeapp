import { redirect } from "next/navigation";
import type { ApiaryRow } from "@/lib/schema";
import { getHive, getApiaries } from "@/lib/data";
import { HiveEditForm } from "./hive-edit-form";

export default async function EditHivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [hive, apiaries] = await Promise.all([getHive(id), getApiaries()]);

  if (!hive) {
    redirect("/hives");
  }

  return (
    <HiveEditForm
      hiveId={hive.id}
      initialApiaryId={hive.apiaryId}
      initialName={hive.name}
      initialQueenBreed={hive.queenBreed ?? ""}
      initialQueenClipped={hive.queenClipped}
      initialNotes={hive.notes ?? ""}
      apiaries={apiaries as Pick<ApiaryRow, "id" | "name">[]}
    />
  );
}

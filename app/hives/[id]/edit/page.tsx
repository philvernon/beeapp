import { redirect } from "next/navigation";
import { validateUuid } from "@/lib/api-error";
import { getHive, getApiaries } from "@/lib/data";
import { HiveEditForm } from "./hive-edit-form";

export default async function EditHivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  validateUuid(id, "hive id");
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
      apiaries={apiaries.map(({ id, name }) => ({ id, name }))}
    />
  );
}

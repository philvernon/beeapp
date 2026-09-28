import { redirect } from "next/navigation";
import { getHive, getApiaries } from "@/lib/data";
import { HiveEditForm } from "./hive-edit-form";

export default async function EditHivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    redirect("/hives");
  }
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

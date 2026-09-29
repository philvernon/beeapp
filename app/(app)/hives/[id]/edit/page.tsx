import { redirect } from "next/navigation";
import { HiveSelect } from "@/lib/schema";
import { getHive, getApiaries } from "@/lib/data";
import { HiveEditForm } from "./hive-edit-form";

export default async function EditHivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = HiveSelect.shape.id.safeParse(id);

  if (!parsedId.success) {
    redirect("/hives");
  }

  const [hive, apiaries] = await Promise.all([
    getHive(parsedId.data),
    getApiaries(),
  ]);

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

import { redirect } from "next/navigation";
import { getApiary } from "@/lib/data";
import { ApiaryEditForm } from "./apiary-edit-form";

export default async function EditApiaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiary = await getApiary(id);

  if (!apiary) {
    redirect("/apiaries");
  }

  return (
    <ApiaryEditForm
      apiaryId={apiary.id}
      initialName={apiary.name}
      initialNotes={apiary.notes ?? ""}
    />
  );
}

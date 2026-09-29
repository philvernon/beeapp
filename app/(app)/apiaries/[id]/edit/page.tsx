import { redirect } from "next/navigation";
import { ApiarySelect } from "@/lib/schema";
import { getApiary } from "@/lib/data";
import { ApiaryEditForm } from "./apiary-edit-form";

export default async function EditApiaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = ApiarySelect.shape.id.safeParse(id);

  if (!parsedId.success) {
    redirect("/apiaries");
  }

  const apiary = await getApiary(parsedId.data);

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

import type { ApiaryRow } from "@/lib/schema";
import { getApiaries } from "@/lib/data";
import { NewHiveForm } from "./new-hive-form";

export default async function NewHivePage({
  searchParams,
}: {
  searchParams: Promise<{ apiary_id?: string }>;
}) {
  const params = await searchParams;
  const preselectedApiary = params.apiary_id;
  const apiaries = await getApiaries();

  return (
    <NewHiveForm
      apiaries={apiaries as Pick<ApiaryRow, "id" | "name">[]}
      preselectedApiaryId={preselectedApiary ?? null}
    />
  );
}

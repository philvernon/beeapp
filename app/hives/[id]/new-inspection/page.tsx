import { redirect } from "next/navigation";
import Link from "next/link";
import { getHive } from "@/lib/data";
import { InspectionForm } from "./inspection-form";
import { Toaster } from "@/components/ui/toast";

export default async function NewInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hive = await getHive(id);

  if (!hive) {
    redirect("/hives");
  }

  return (
    <div className="flex min-h-0 flex-col max-w-2xl flex-1">
      <Toaster />
      <Link
        href={`/hives/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
      >
        ← Back to {hive.name}
      </Link>
      <h1 className="text-base font-bold text-foreground mb-1">
        New Inspection — {hive.name}
      </h1>

      <InspectionForm hiveId={id} />
    </div>
  );
}

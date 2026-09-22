import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiaryWithHives } from "@/lib/data";

export default async function ApiaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiary = await getApiaryWithHives(id);

  if (!apiary) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/apiaries"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Apiaries
        </Link>
        <div className="flex gap-2">
          <ButtonLink variant="outline" size="sm" href={`/apiaries/${id}/edit`}>
            Edit
          </ButtonLink>
          <ButtonLink size="sm" href={`/hives/new?apiary_id=${id}`}>
            + New Hive
          </ButtonLink>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{apiary.name}</h1>
        {apiary.notes && (
          <p className="mt-1 text-sm text-muted-foreground">{apiary.notes}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Created {new Date(apiary.createdAt).toLocaleDateString()}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">
        Hives ({apiary.hives?.length || 0})
      </h2>

      {!apiary.hives || apiary.hives.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center border border-dashed border-border">
          No hives in this apiary yet.{" "}
          <Link
            href={`/hives/new?apiary_id=${id}`}
            className="text-primary hover:underline font-medium"
          >
            Add one →
          </Link>
        </p>
      ) : (
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
          {apiary.hives.map((hive) => (
            <Link key={hive.id} href={`/hives/${hive.id}`}>
              <Card className="group hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {hive.name}
                    </CardTitle>
                    {hive.queenClipped && (
                      <Badge variant="secondary">Clipped</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {hive.queenBreed && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Queen: {hive.queenBreed}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {hive.inspectionCount ?? 0} inspection
                    {hive.inspectionCount === 1 ? "" : "s"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

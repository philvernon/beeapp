import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getHive, getInspections } from "@/lib/data";
import { InspectionCard } from "./inspection-card";
import { Download } from "lucide-react";

export default async function HiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hive = await getHive(id);

  if (!hive) notFound();

  const inspections = await getInspections({ hiveId: id });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/hives"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Hives
        </Link>
        <div className="flex gap-2">
          <ButtonLink variant="outline" size="sm" href={`/hives/${id}/edit`}>
            Edit Hive
          </ButtonLink>
          <ButtonLink size="sm" href={`/hives/${id}/new-inspection`}>
            + New Inspection
          </ButtonLink>
        </div>
      </div>

      {/* Hive Info */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{hive.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {hive.apiaryName}
              </p>
            </div>
            {hive.queenClipped && (
              <Badge variant="secondary">Queen Clipped</Badge>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {hive.queenBreed && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Queen Breed
                </p>
                <p className="text-sm font-medium mt-1 text-foreground">
                  {hive.queenBreed}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Inspections
              </p>
              <p className="text-sm font-medium mt-1 text-foreground">
                {inspections.length}
              </p>
            </div>
            {hive.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Notes
                </p>
                <p className="text-sm mt-1 text-foreground">{hive.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Card */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Hive QR Code</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 flex items-center gap-6">
          <img
            src={`/api/hives/${id}/qr`}
            alt={`QR code for ${hive.name}`}
            className="w-32 h-32"
          />
          <Link
            href={`/api/hives/${id}/qr`}
            download={`${hive.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </Link>
        </CardContent>
      </Card>

      {/* Inspections */}
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Inspection History
      </h2>

      {inspections.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center border border-dashed border-border">
          No inspections recorded yet.{" "}
          <Link
            href={`/hives/${id}/new-inspection`}
            className="text-primary hover:underline font-medium"
          >
            Record one →
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {inspections.map((insp) => (
            <InspectionCard key={insp.id} inspection={insp} />
          ))}
        </div>
      )}
    </div>
  );
}

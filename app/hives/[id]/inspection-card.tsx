import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface InspectionRow {
  id: string;
  hiveId: string;
  inspectionDate: string;
  queenSeen: boolean | null;
  queenColour?: string | null;
  queenCellsFound?: number | null;
  queenCellsRemoved: boolean | null;
  eggsSeen: boolean | null;
  broodPatternOk: boolean | null;
  broodFrameCount?: number | null;
  storeFrames?: number | null;
  roomFrames?: number | null;
  healthOk: boolean | null;
  chalkBroodSuspected: boolean | null;
  efbSuspected: boolean | null;
  afbSuspected: boolean | null;
  varroaLevel?: string | null;
  varroaCount?: number | null;
  temperamentScore?: number | null;
  feedLitresLightSyrup?: string | null;
  feedLitresHeavySyrup?: string | null;
  supersChange?: string | null;
  weatherTemperatureC?: string | null;
  weatherCondition?: string | null;
  notes?: string | null;
  createdAt: Date;
  hiveName?: string | null;
  apiaryName?: string | null;
}

export function InspectionCard({ inspection }: { inspection: InspectionRow }) {
  const date = new Date(
    inspection.inspectionDate + "T00:00:00",
  ).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const statusBadge = inspection.healthOk ? (
    <Badge variant="secondary">Healthy</Badge>
  ) : (
    <Badge variant="outline">Issues</Badge>
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">{date}</span>
          {statusBadge}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {inspection.queenSeen ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Queen</p>
                <p className="font-medium text-foreground">
                  Seen{" "}
                  {inspection.queenColour ? `(${inspection.queenColour})` : ""}
                </p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Queen</p>
              <p className="font-medium text-foreground">Not seen</p>
            </div>
          )}
          {inspection.eggsSeen !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Eggs</p>
              <p className="font-medium text-foreground">
                {inspection.eggsSeen ? "Yes" : "No"}
              </p>
            </div>
          )}
          {inspection.broodFrameCount !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Brood Frames</p>
              <p className="font-medium text-foreground">
                {inspection.broodFrameCount}
              </p>
            </div>
          )}
          {inspection.storeFrames !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Store Frames</p>
              <p className="font-medium text-foreground">
                {inspection.storeFrames}
              </p>
            </div>
          )}
          {inspection.roomFrames !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Room Frames</p>
              <p className="font-medium text-foreground">
                {inspection.roomFrames}
              </p>
            </div>
          )}
          {inspection.varroaLevel && (
            <div>
              <p className="text-xs text-muted-foreground">Varroa</p>
              <p className="font-medium text-foreground">
                {inspection.varroaLevel.toUpperCase()}
                {inspection.varroaCount !== null &&
                  ` (${inspection.varroaCount})`}
              </p>
            </div>
          )}
          {inspection.temperamentScore !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Temperament</p>
              <p className="font-medium text-foreground">
                {inspection.temperamentScore}/10
              </p>
            </div>
          )}
        </div>

        {inspection.notes && (
          <>
            <Separator className="my-3" />
            <p className="text-sm text-muted-foreground italic">
              {inspection.notes}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

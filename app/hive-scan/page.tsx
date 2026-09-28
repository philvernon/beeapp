"use client";

import { useRouter } from "next/navigation";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export default function HiveScanPage() {
  const router = useRouter();

  const handleResult = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue.trim();
      router.replace(`/hives/${encodeURIComponent(scannedValue)}/new-inspection`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scan Hive QR Code</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Scanner
            onScan={handleResult}
            onError={(error) => console.log(error?.message)}
          />
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => router.push("/hives")}
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
}

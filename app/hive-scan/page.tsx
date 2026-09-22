"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QrReader } from "react-qr-scan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HiveScanPage() {
	const router = useRouter();
	const [scanned, setScanned] = useState(false);

	const handleResult = useCallback(
		(result: { getText(): string } | null | undefined, _err: unknown) => {
			if (result && !scanned) {
				setScanned(true);
				const url = result.getText().trim();
				const match = url.match(/\/hives\/([a-f0-9-]+)/i);
				if (match) {
					router.push(`/hives/${match[1]}/new-inspection`);
				} else {
					router.push(url);
				}
			}
		},
		[router, scanned],
	);

	return (
		<div className="max-w-md mx-auto space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Scan Hive QR Code</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<QrReader
						constraints={{ facingMode: "environment" }}
						onResult={handleResult}
						containerStyle={{ width: "100%" }}
						videoStyle={{ width: "100%", objectFit: "cover" }}
					/>
				</CardContent>
			</Card>

			<Button variant="outline" onClick={() => router.push("/hives")} className="w-full">
				Cancel
			</Button>
		</div>
	);
}

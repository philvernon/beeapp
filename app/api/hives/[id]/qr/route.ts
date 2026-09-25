import { NextResponse } from "next/server";
import { getHive } from "@/lib/data";
import QRCode from "qrcode";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const hive = await getHive(id);
  if (!hive) {
    return NextResponse.json({ error: "Hive not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/hives/${id}/new-inspection`;

  try {
    const png = await QRCode.toBuffer(url, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}

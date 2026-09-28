import { NextResponse } from "next/server";
import { getHive } from "@/lib/data";
import QRCode from "qrcode";
import { validateUuid, errorResponse } from "@/lib/api-error";
import { requireApiSession } from "@/lib/auth-middleware";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if ("status" in auth) return auth;

  try {
    const { id } = await params;
    validateUuid(id, "hive id");

    const hive = await getHive(id);
    if (!hive) {
      return NextResponse.json({ error: "Hive not found" }, { status: 404 });
    }

    const png = await QRCode.toBuffer(id, {
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
  } catch (err) {
    return errorResponse(err);
  }
}

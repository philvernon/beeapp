import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/sign-out — invalidate session and clear cookies.
 */
export async function POST(request: Request) {
  try {
    await auth.api.signOut({
      headers: request.headers,
    });

    return NextResponse.json(
      { redirect: "/sign-in" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Sign out failed" },
      { status: 500 },
    );
  }
}

import "server-only";

import { headers } from "next/headers";
import { auth } from "./auth";
import { NextResponse } from "next/server";

/**
 * Validate a Better Auth server-side session for API routes.
 *
 * Returns the session object if authenticated, otherwise returns
 * a JSON 401 response consistent with #37.
 */
export async function requireApiSession(): Promise<
  NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>> | Response
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}

import "server-only";

import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";

/**
 * Validate a Better Auth server-side session.
 *
 * Returns the session object if authenticated, otherwise redirects to /sign-in.
 */
export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

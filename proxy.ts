import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Public routes that do not require authentication.
 */
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/auth"];

/**
 * Check whether a path should be treated as public.
 */
function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (pub) => pathname === pub || pathname.startsWith(pub + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Real DB-backed session validation via Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    // Redirect unauthenticated users to sign-in
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated — continue
  return NextResponse.next();
}

/**
 * Run proxy on all routes except static assets, API health checks, etc.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

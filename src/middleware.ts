import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Better Auth session token cookie name (matches better-auth defaults).
 */
const SESSION_COOKIE_NAME = "session_token";

/**
 * Public routes that do not require authentication.
 */
const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/hive-scan", // camera-based scan — no auth needed
];

/**
 * Check whether a path should be treated as public.
 */
function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (pub) => pathname === pub || pathname.startsWith(pub + "/"),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    // Redirect unauthenticated users to sign-in
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated — continue
  return NextResponse.next();
}

/**
 * Run middleware on all routes except static assets, API health checks, etc.
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

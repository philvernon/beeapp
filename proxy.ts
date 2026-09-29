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
    // BeeApp API routes return JSON 401; browser pages redirect to sign-in.
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set(
      "callbackUrl",
      pathname + request.nextUrl.search,
    );
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

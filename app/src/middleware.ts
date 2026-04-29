import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Routes that require an authenticated portal session. */
const PROTECTED_PREFIXES = [
  "/cuenta",
  "/cotizaciones",
  "/facturas",
  "/pedidos",
  "/historial",
  "/descargas",
  "/soporte",
  "/catalogo-pdf",
  "/nuestros-clientes",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let static assets, Next.js internals, and API routes pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.[a-zA-Z0-9]{2,5}$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Public routes get security headers only
  if (!isProtectedRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // ── Protected route ──
  // Check for the same-domain session marker cookie set by auth-context.tsx
  // after successful login. The real session validation happens client-side
  // via getSessionContext() against the ERP (cross-domain with credentials).
  // We can't validate ERP cookies here because they're on erp.merkleydetails.com
  // while this middleware runs on merkleydetails.com.

  const hasSession = request.cookies.get("mw_session")?.value === "1";

  if (!hasSession) {
    // Build redirect URL preserving the original destination (path + query)
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "merkleydetails.com";
    const origin = `${proto}://${host}`;
    const loginUrl = new URL("/auth/login", origin);
    const { search } = request.nextUrl;
    loginUrl.searchParams.set("next", pathname + search);
    const redirect = NextResponse.redirect(loginUrl);
    // Prevent the Next.js App Router from caching this redirect on the
    // client. Without this, a user who verifies their email (flipping them
    // from logged-out to logged-in) can get stuck bouncing through /auth/login
    // because router.push serves the previously-cached redirect instead of
    // hitting middleware with the fresh mw_session cookie. See verify flow.
    redirect.headers.set("Cache-Control", "no-store, must-revalidate");
    return redirect;
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

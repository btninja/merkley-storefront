import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ERP_BASE =
  process.env.NEXT_PUBLIC_ERP_URL ||
  process.env.FRAPPE_BASE_URL ||
  "https://erp.merkleydetails.com";

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

/**
 * Validate a Frappe portal session against the ERPNext backend.
 * Returns true if the session is valid, false otherwise.
 */
async function validateSession(
  request: NextRequest
): Promise<boolean> {
  const sessionUrl = new URL(
    "/api/method/merkley_web.api.auth.get_session_context",
    ERP_BASE
  );
  const cookie = request.headers.get("cookie");

  try {
    const response = await fetch(sessionUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) return false;

    const data = await response.json();
    return Boolean(data?.message?.email);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let static assets, Next.js internals, and API routes pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public routes get security headers only
  if (!isProtectedRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // ── Protected route: validate session ──

  const sid = request.cookies.get("sid")?.value;
  const userId = request.cookies.get("user_id")?.value;

  // Build redirect base from forwarded headers (not request.url which is localhost behind nginx)
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "merkleydetails.com";
  const origin = `${proto}://${host}`;

  // Fast path: no cookies = definitely not authenticated
  if (!sid || sid === "Guest" || !userId || userId === "Guest") {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  // Basic format validation
  if (sid.length < 20) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  if (userId !== "Administrator" && !userId.includes("@")) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  // Validate against ERPNext backend
  const isValid = await validateSession(request);

  if (!isValid) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

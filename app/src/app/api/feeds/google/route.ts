import { NextRequest } from "next/server";

import { ERP_BASE_URL as ERP_BASE } from "@/lib/env";

const FEED_USER = process.env.FEED_USERNAME || "merkley";
const FEED_PASS = process.env.FEED_PASSWORD || "";
const FEED_TOKEN = process.env.FEED_TOKEN || "";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function checkAuth(request: NextRequest): boolean {
  // Option 1: Token-based auth via query parameter (?token=xxx)
  // This is the preferred method for Google Merchant Center / Meta Commerce
  if (FEED_TOKEN) {
    const token = request.nextUrl.searchParams.get("token");
    if (token === FEED_TOKEN) return true;
  }

  // Option 2: HTTP Basic Auth (browser / manual access)
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const [user, pass] = decoded.split(":");
      return user === FEED_USER && pass === FEED_PASS && FEED_PASS !== "";
    } catch {
      return false;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Product Feed"' },
    });
  }

  try {
    const res = await fetch(
      `${ERP_BASE}/api/method/merkley_web.api.feeds.google_product_feed`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return new Response("Feed unavailable", { status: 502 });
    }

    const body = await res.text();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="merkley-google-feed.xml"',
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new Response("Feed error", { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { writeFile, appendFile } from "fs/promises";

import { ERP_BASE_URL as ERP_URL } from "@/lib/env";

const WEBHOOK_KEY = process.env.GOOGLE_ADS_WEBHOOK_KEY ?? "";
const LOG_FILE = "/tmp/google-ads-webhook.log";

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log("[GADS-WEBHOOK]", msg);
  try {
    await appendFile(LOG_FILE, line);
  } catch {
    await writeFile(LOG_FILE, line);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "no-ua";

  await log(`POST received | IP: ${ip} | UA: ${ua}`);

  try {
    const rawBody = await request.text();
    await log(`Body length: ${rawBody.length} | Body: ${rawBody.substring(0, 500)}`);

    const data = JSON.parse(rawBody);

    // Verify the webhook key (reject if key is unconfigured)
    if (!WEBHOOK_KEY || data.google_key !== WEBHOOK_KEY) {
      await log(`REJECTED: Invalid key: ${data.google_key?.substring(0, 10)}...`);
      return NextResponse.json(
        { status: "error", message: "Invalid key" },
        { status: 403 }
      );
    }

    await log(`KEY OK. Forwarding to ERP...`);

    // Forward to ERPNext backend (fire-and-forget)
    fetch(
      `${ERP_URL}/api/method/merkley_web.api.google_ads_webhook.receive_lead`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawBody,
      }
    ).catch((err) => {
      console.error("Failed to forward to ERP:", err);
    });

    await log(`Responded 200 OK to Google`);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    await log(`ERROR: ${err}`);
    return NextResponse.json(
      { status: "error", message: "Bad request" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "no-ua";
  await log(`GET received | IP: ${ip} | UA: ${ua}`);
  return NextResponse.json({ status: "ok", service: "google-ads-webhook" });
}

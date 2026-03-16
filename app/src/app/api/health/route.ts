export async function GET() {
  return Response.json({
    app: "merkley-dev-storefront",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";

// No auth, no DB calls — purely "is the Node process up and serving requests", consumed by
// Docker's HEALTHCHECK and Caddy/uptime checks. Anything beyond that belongs in real monitoring.
export async function GET() {
  return NextResponse.json({ success: true, data: { status: "ok" } });
}

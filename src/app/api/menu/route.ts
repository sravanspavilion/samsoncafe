import { NextResponse } from "next/server";
import { fetchMenuFromAppsScript } from "@/lib/google-apps-script";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await fetchMenuFromAppsScript(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The menu is unavailable right now. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

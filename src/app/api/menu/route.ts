import { NextResponse } from "next/server";
import { fetchMenuFromAppsScript, fallbackMenu } from "@/lib/google-apps-script";
export const dynamic = "force-dynamic";
export async function GET() { try { return NextResponse.json(await fetchMenuFromAppsScript(), { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json(fallbackMenu, { headers: { "Cache-Control": "no-store", "X-Samsons-Fallback": "true" } }); } }

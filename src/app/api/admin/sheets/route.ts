import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const READ_ACTIONS: Record<string, string> = {
  getOrders: "orders",
  getMenu: "menu",
  getInventory: "inventory",
  getPayments: "payments",
  getStats: "stats",
};

if (!APPS_SCRIPT_URL) {
  console.warn("GOOGLE_APPS_SCRIPT_URL not configured");
}

interface SheetsRequest {
  action: string;
  payload?: Record<string, unknown>;
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { error: "Apps Script URL not configured" },
      { status: 500 }
    );
  }

  try {
    const body: SheetsRequest = await request.json();
    const { action, payload = {}, apiKey } = body;

    // Verify API key if provided (optional additional security)
    if (apiKey && apiKey !== process.env.SESSION_SECRET) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const url = new URL(APPS_SCRIPT_URL);
    const upstreamAction = READ_ACTIONS[action] ?? action;
    url.searchParams.set("action", upstreamAction);

    // For GET-like actions, use query params
    const isGetAction = [
      "menu",
      "orders",
      "inventory",
      "payments",
      "stats",
      "getOrders",
      "getInventory",
      "getMenu",
      "getPayments",
    ].includes(upstreamAction);

    let response: Response;

    if (isGetAction) {
      // Add payload as query params for GET actions
      Object.entries(payload).forEach(([key, value]) => {
        if (key !== "action") url.searchParams.set(key, String(value));
      });

      response = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } else {
      // POST actions with body
      response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ action, ...payload }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Apps Script error:", response.status, errorText);
      return NextResponse.json(
        { error: `Apps Script returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response from Apps Script:", text.slice(0, 500));
      return NextResponse.json(
        { error: "Invalid response from Apps Script" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Handle Apps Script error responses
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Sheets API proxy error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with Google Sheets" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { error: "Apps Script URL not configured" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "menu";

    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set("action", READ_ACTIONS[action] ?? action);

    // Forward all other search params
    searchParams.forEach((value, key) => {
      if (key !== "action") url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Apps Script returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    if (data?.error || data?.success === false) {
      return NextResponse.json(
        { error: data.error || "Google Sheets request failed" },
        { status: 502 }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sheets API GET error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with Google Sheets" },
      { status: 500 }
    );
  }
}

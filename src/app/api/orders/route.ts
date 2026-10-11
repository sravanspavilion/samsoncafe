import { NextResponse } from "next/server";
import { OrderSubmissionError, submitOrderToAppsScript, fetchOrdersFromAppsScript } from "@/lib/google-apps-script";
import type { OrderPayload } from "@/types";

export async function GET() {
  try {
    const orders = await fetchOrdersFromAppsScript();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Orders are unavailable right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as OrderPayload;
    if (!Array.isArray(body.items) || !body.items.length) {
      return NextResponse.json({ error: "Please add at least one item to your order." }, { status: 400 });
    }
    if (body.items.some((item) => !item.id || !item.name || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0)) {
      return NextResponse.json({ error: "One or more order items are invalid." }, { status: 400 });
    }
    const orderId = `SC-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const confirmedOrderId = await submitOrderToAppsScript({ ...body, customerName: body.customerName?.trim() || "", contact: body.contact?.trim() || "", pickupNote: body.pickupNote?.trim() }, orderId);
    return NextResponse.json({ orderId: confirmedOrderId }, { status: 201 });
  } catch (error) {
    console.error("Order submission failed:", error);
    if (error instanceof OrderSubmissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Your order could not be submitted. Please try again." }, { status: 500 });
  }
}

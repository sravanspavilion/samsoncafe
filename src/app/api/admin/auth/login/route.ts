import { NextRequest, NextResponse } from "next/server";
import { createSession, validatePassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await createSession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSession {
  isLoggedIn: boolean;
  user?: {
    name: string;
    role: "admin";
  };
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "samsons-admin-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
};

export async function getSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const session = await getIronSession<AdminSession>(cookieStore, sessionOptions);
  // Ensure isLoggedIn is always a boolean
  return {
    isLoggedIn: session.isLoggedIn === true,
    user: session.user,
  };
}

export async function createSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const session = await getIronSession<AdminSession>(cookieStore, sessionOptions);
  session.isLoggedIn = true;
  session.user = { name: "Admin", role: "admin" };
  await session.save();
  return {
    isLoggedIn: true,
    user: { name: "Admin", role: "admin" },
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<AdminSession>(cookieStore, sessionOptions);
  await session.destroy();
}

export async function verifyAuth(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}

export function validatePassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}
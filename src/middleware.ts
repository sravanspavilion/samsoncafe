import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession, nextProxyCookies } from "iron-session";
import { sessionOptions, AdminSession } from "@/lib/auth";

const protectedPaths = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Allow access to login page and API login endpoint
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/auth/login" ||
    pathname === "/api/admin/auth/logout"
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  if (isProtected) {
    const cookieStore = nextProxyCookies(request, response);
    const session = await getIronSession<AdminSession>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      // Redirect to login page for admin routes
      if (pathname.startsWith("/admin")) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Return 401 for API routes
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
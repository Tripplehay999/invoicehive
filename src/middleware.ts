import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // Admin routes — require role === "admin"
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if ((token.role as string) !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes — require any authenticated user
  const dashboardPaths = ["/dashboard", "/invoices", "/clients", "/expenses", "/reports", "/settings"];
  if (dashboardPaths.some((p) => pathname.startsWith(p))) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/invoices/:path*",
    "/clients/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};

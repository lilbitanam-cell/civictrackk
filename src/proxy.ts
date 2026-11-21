import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { ROLE_HOME_ROUTES } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = sessionCookie?.value
    ? verifySessionToken(sessionCookie.value)
    : null;

  // 1. If user is already authenticated and visits /login or /register, redirect to their role dashboard
  if (session && (pathname === "/login" || pathname === "/register")) {
    const targetUrl = new URL(ROLE_HOME_ROUTES[session.role] || "/citizen/dashboard", request.url);
    return NextResponse.redirect(targetUrl);
  }

  // 2. Protect role-specific routes
  const isCitizenRoute = pathname.startsWith("/citizen");
  const isAdminRoute = pathname.startsWith("/admin");
  const isWorkerRoute = pathname.startsWith("/worker");

  if (isCitizenRoute || isAdminRoute || isWorkerRoute) {
    // If no valid session, redirect to login
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if account is active
    if (!session.isActive) {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      unauthorizedUrl.searchParams.set("reason", "inactive");
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Role-based authorization
    if (isAdminRoute && session.role !== "admin") {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      unauthorizedUrl.searchParams.set("reason", "admin_required");
      return NextResponse.redirect(unauthorizedUrl);
    }

    if (isWorkerRoute && session.role !== "worker" && session.role !== "admin") {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      unauthorizedUrl.searchParams.set("reason", "worker_required");
      return NextResponse.redirect(unauthorizedUrl);
    }

    if (isCitizenRoute && session.role !== "citizen" && session.role !== "admin") {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      unauthorizedUrl.searchParams.set("reason", "citizen_required");
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/citizen/:path*",
    "/admin/:path*",
    "/worker/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ],
};


import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "rbac_token";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const protectedRoutes = [
    "/dashboard",
    "/news",
    "/admin",
    "/farmer",
  ];

  const isProtected = protectedRoutes.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token || !process.env.JWT_SECRET) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(token, secret);

    if (!payload.userId) {
      throw new Error("Invalid session");
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/news/:path*",
    "/admin/:path*",
    "/farmer/:path*",
  ],
};

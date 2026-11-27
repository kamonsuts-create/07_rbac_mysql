import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";

export async function GET(request) {
  try {
    const mode = new URL(request.url).searchParams.get("mode") === "link"
      ? "link"
      : "login";

    // การเชื่อมบัญชีต้องเข้าสู่ระบบ PLUK RAK ก่อน
    if (mode === "link") {
      const session = await getSession();

      if (!session) {
        return NextResponse.redirect(
          new URL("/login?google_error=login_required", request.url)
        );
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Google OAuth environment variables are missing");
    }

    const state = randomBytes(32).toString("hex");
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    const authUrl = client.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account",
    });

    const response = NextResponse.redirect(authUrl);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    };

    response.cookies.set("google_oauth_state", state, cookieOptions);
    response.cookies.set("google_oauth_mode", mode, cookieOptions);

    return response;
  } catch (error) {
    console.error("Google Login Start Error:", error);

    return NextResponse.redirect(
      new URL("/login?google_error=start_failed", request.url)
    );
  }
}

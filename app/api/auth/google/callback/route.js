import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import pool from "@/lib/db";
import { getSession, setSession } from "@/lib/auth";

function clearCookies(response) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };

  response.cookies.set("google_oauth_state", "", options);
  response.cookies.set("google_oauth_mode", "", options);
  return response;
}

function redirectResult(request, mode, key, value) {
  const path = mode === "link" ? "/dashboard" : "/login";
  const url = new URL(path, request.url);
  url.searchParams.set(key, value);
  return clearCookies(NextResponse.redirect(url));
}

export async function GET(request) {
  const mode =
    request.cookies.get("google_oauth_mode")?.value === "link"
      ? "link"
      : "login";

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const googleError = searchParams.get("error");
    const savedState =
      request.cookies.get("google_oauth_state")?.value;

    const errorKey =
      mode === "link" ? "google_link_error" : "google_error";

    if (googleError) {
      return redirectResult(request, mode, errorKey, "google_denied");
    }

    if (!code || !state || !savedState || state !== savedState) {
      return redirectResult(request, mode, errorKey, "invalid_state");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Google OAuth environment variables are missing");
    }

    const client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return redirectResult(
        request,
        mode,
        errorKey,
        "missing_id_token"
      );
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return redirectResult(
        request,
        mode,
        errorKey,
        "email_not_verified"
      );
    }

    const googleSub = payload.sub;
    const email = payload.email.trim().toLowerCase();

    // MODE: LINK - เชื่อมกับสมาชิกที่ Login อยู่เท่านั้น
    if (mode === "link") {
      const session = await getSession();

      if (!session) {
        return redirectResult(
          request,
          mode,
          errorKey,
          "login_required"
        );
      }

      const [currentUsers] = await pool.execute(
        `SELECT id, google_sub, is_active
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [session.userId]
      );

      const currentUser = currentUsers[0];

      if (!currentUser || !currentUser.is_active) {
        return redirectResult(
          request,
          mode,
          errorKey,
          "account_inactive"
        );
      }

      const [linkedUsers] = await pool.execute(
        `SELECT id FROM users
         WHERE google_sub = ?
         LIMIT 1`,
        [googleSub]
      );

      if (
        linkedUsers.length > 0 &&
        Number(linkedUsers[0].id) !== Number(currentUser.id)
      ) {
        return redirectResult(
          request,
          mode,
          errorKey,
          "google_account_in_use"
        );
      }

      if (currentUser.google_sub === googleSub) {
        return redirectResult(
          request,
          mode,
          "google_linked",
          "1"
        );
      }

      if (currentUser.google_sub) {
        return redirectResult(
          request,
          mode,
          errorKey,
          "account_already_linked"
        );
      }

      const [result] = await pool.execute(
        `UPDATE users
         SET google_sub = ?
         WHERE id = ? AND google_sub IS NULL`,
        [googleSub, currentUser.id]
      );

      if (result.affectedRows !== 1) {
        return redirectResult(
          request,
          mode,
          errorKey,
          "link_failed"
        );
      }

      return redirectResult(
        request,
        mode,
        "google_linked",
        "1"
      );
    }

    // MODE: LOGIN - คงระบบ Google Login เดิม
    const [googleUsers] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.google_sub,
              u.is_active, r.code AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.google_sub = ?
       LIMIT 1`,
      [googleSub]
    );

    let user = googleUsers[0];

    if (!user) {
      const [emailUsers] = await pool.execute(
        `SELECT u.id, u.full_name, u.email, u.google_sub,
                u.is_active, r.code AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE LOWER(u.email) = ?
         LIMIT 1`,
        [email]
      );

      user = emailUsers[0];

      if (!user) {
        return redirectResult(
          request,
          mode,
          errorKey,
          "account_not_found"
        );
      }

      if (user.google_sub && user.google_sub !== googleSub) {
        return redirectResult(
          request,
          mode,
          errorKey,
          "account_already_linked"
        );
      }

      if (!user.google_sub) {
        const [result] = await pool.execute(
          `UPDATE users
           SET google_sub = ?
           WHERE id = ? AND google_sub IS NULL`,
          [googleSub, user.id]
        );

        if (result.affectedRows !== 1) {
          return redirectResult(
            request,
            mode,
            errorKey,
            "link_failed"
          );
        }
      }
    }

    if (!user.is_active) {
      return redirectResult(
        request,
        mode,
        errorKey,
        "account_inactive"
      );
    }

    await setSession({
      id: user.id,
      role: user.role,
    });

    const destination =
      user.role === "farmer"
        ? "/dashboard/farmer"
        : user.role === "buyer"
          ? "/dashboard/buyer"
          : "/dashboard";

    return clearCookies(
      NextResponse.redirect(new URL(destination, request.url))
    );
  } catch (error) {
    console.error("Google Callback Error:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return redirectResult(
        request,
        mode,
        mode === "link" ? "google_link_error" : "google_error",
        "google_account_in_use"
      );
    }

    return redirectResult(
      request,
      mode,
      mode === "link" ? "google_link_error" : "google_error",
      "callback_failed"
    );
  }
}

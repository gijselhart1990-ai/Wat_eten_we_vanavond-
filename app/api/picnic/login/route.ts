import { NextRequest, NextResponse } from "next/server";
import { safePicnicError } from "../../../../lib/picnic/api";
import { generatePicnic2FACode, loginToPicnic } from "../../../../lib/picnic/client";
import {
  encryptPicnicSession,
  isPicnicConfigured,
  PICNIC_2FA_COOKIE,
  PICNIC_SESSION_COOKIE,
  picnicCookieOptions,
} from "../../../../lib/picnic/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isPicnicConfigured()) {
    return NextResponse.json({ error: "De Picnic-koppeling is nog niet geconfigureerd." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password || username.length > 160 || password.length > 256) {
    return NextResponse.json({ error: "Vul je Picnic-gebruikersnaam en wachtwoord in." }, { status: 400 });
  }

  try {
    const login = await loginToPicnic(username, password);
    const response = NextResponse.json({ connected: !login.requires2FA, requires2FA: login.requires2FA });

    if (login.requires2FA) {
      await generatePicnic2FACode(login.authKey);
      response.cookies.set(PICNIC_2FA_COOKIE, encryptPicnicSession(login.authKey), picnicCookieOptions(10 * 60));
      response.cookies.set(PICNIC_SESSION_COOKIE, "", picnicCookieOptions(0));
    } else {
      response.cookies.set(PICNIC_SESSION_COOKIE, encryptPicnicSession(login.authKey), picnicCookieOptions(30 * 24 * 60 * 60));
      response.cookies.set(PICNIC_2FA_COOKIE, "", picnicCookieOptions(0));
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: safePicnicError(error) }, { status: 401 });
  }
}

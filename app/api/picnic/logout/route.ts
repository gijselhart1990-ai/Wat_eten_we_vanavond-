import { NextRequest, NextResponse } from "next/server";
import { logoutFromPicnic } from "../../../../lib/picnic/client";
import {
  decryptPicnicSession,
  PICNIC_2FA_COOKIE,
  PICNIC_SESSION_COOKIE,
  picnicCookieOptions,
} from "../../../../lib/picnic/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(PICNIC_SESSION_COOKIE)?.value;

  if (token) {
    try {
      const session = decryptPicnicSession(token);
      await logoutFromPicnic(session.authKey);
    } catch {
      // De lokale cookies worden ook gewist wanneer de externe sessie al verlopen is.
    }
  }

  const response = NextResponse.json({ connected: false });
  response.cookies.set(PICNIC_SESSION_COOKIE, "", picnicCookieOptions(0));
  response.cookies.set(PICNIC_2FA_COOKIE, "", picnicCookieOptions(0));
  return response;
}

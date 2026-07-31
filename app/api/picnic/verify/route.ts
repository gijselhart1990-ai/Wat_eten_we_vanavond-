import { NextRequest, NextResponse } from "next/server";
import { safePicnicError } from "../../../../lib/picnic/api";
import { verifyPicnic2FA } from "../../../../lib/picnic/client";
import {
  decryptPicnicSession,
  encryptPicnicSession,
  PICNIC_2FA_COOKIE,
  PICNIC_SESSION_COOKIE,
  picnicCookieOptions,
} from "../../../../lib/picnic/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const pendingToken = request.cookies.get(PICNIC_2FA_COOKIE)?.value;
  if (!pendingToken) {
    return NextResponse.json({ error: "De verificatiesessie is verlopen. Log opnieuw in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ error: "Vul de ontvangen verificatiecode in." }, { status: 400 });
  }

  try {
    const pendingSession = decryptPicnicSession(pendingToken, 10 * 60 * 1000);
    const authKey = await verifyPicnic2FA(pendingSession.authKey, code);
    const response = NextResponse.json({ connected: true });
    response.cookies.set(PICNIC_SESSION_COOKIE, encryptPicnicSession(authKey), picnicCookieOptions(30 * 24 * 60 * 60));
    response.cookies.set(PICNIC_2FA_COOKIE, "", picnicCookieOptions(0));
    return response;
  } catch (error) {
    return NextResponse.json({ error: safePicnicError(error) }, { status: 401 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { decryptPicnicSession, isPicnicConfigured, PICNIC_SESSION_COOKIE, picnicCookieOptions } from "../../../../lib/picnic/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const configured = isPicnicConfigured();
  const token = request.cookies.get(PICNIC_SESSION_COOKIE)?.value;

  if (!configured || !token) {
    return NextResponse.json({ configured, connected: false });
  }

  try {
    decryptPicnicSession(token);
    return NextResponse.json({ configured: true, connected: true });
  } catch {
    const response = NextResponse.json({ configured: true, connected: false });
    response.cookies.set(PICNIC_SESSION_COOKIE, "", picnicCookieOptions(0));
    return response;
  }
}

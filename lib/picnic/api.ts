import type { NextRequest } from "next/server";
import { decryptPicnicSession, PICNIC_SESSION_COOKIE } from "./session";

export function getPicnicAuthKey(request: NextRequest) {
  const token = request.cookies.get(PICNIC_SESSION_COOKIE)?.value;
  if (!token) throw new Error("Verbind eerst je Picnic-account.");
  return decryptPicnicSession(token).authKey;
}

export function safePicnicError(error: unknown) {
  const message = error instanceof Error ? error.message : "Onbekende fout";
  if (/login|password|wachtwoord|unauthor|auth|forbidden|401|403/i.test(message)) {
    return "De Picnic-sessie is niet meer geldig. Verbind je account opnieuw.";
  }
  return `Picnic kon de aanvraag niet verwerken: ${message}`;
}

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export const PICNIC_SESSION_COOKIE = "wateten_picnic_session";
export const PICNIC_2FA_COOKIE = "wateten_picnic_2fa";

interface PicnicSessionPayload {
  authKey: string;
  createdAt: number;
}

function getEncryptionKey() {
  const secret = process.env.PICNIC_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("PICNIC_SESSION_SECRET ontbreekt of is korter dan 32 tekens.");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function isPicnicConfigured() {
  return Boolean(process.env.PICNIC_SESSION_SECRET && process.env.PICNIC_SESSION_SECRET.length >= 32);
}

export function encryptPicnicSession(authKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const payload: PicnicSessionPayload = { authKey, createdAt: Date.now() };
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptPicnicSession(token: string, maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  const packed = Buffer.from(token, "base64url");
  if (packed.length < 29) throw new Error("Ongeldige Picnic-sessie.");

  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const encrypted = packed.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  const clear = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  const payload = JSON.parse(clear) as PicnicSessionPayload;

  if (!payload.authKey || !payload.createdAt || Date.now() - payload.createdAt > maxAgeMs) {
    throw new Error("De Picnic-sessie is verlopen.");
  }

  return payload;
}

export function picnicCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

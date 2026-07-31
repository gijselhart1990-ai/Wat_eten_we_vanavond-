import { createHash } from "crypto";
import type { PicnicProduct, PicnicShoppingItemInput } from "./types";

const API_URL = "https://storefront-prod.nl.picnicinternational.com/api/15";
const DEVICE_ID = "3C417201548B2E3B";
const AGENT = "30100;1.236.1-15553;";

function headers(authKey?: string, includePicnicHeaders = false) {
  return {
    "User-Agent": "okhttp/4.9.0",
    "Content-Type": "application/json; charset=UTF-8",
    "Accept-Language": "nl",
    ...(authKey ? { "x-picnic-auth": authKey } : {}),
    ...(includePicnicHeaders ? { "x-picnic-agent": AGENT, "x-picnic-did": DEVICE_ID } : {}),
  };
}

async function readError(response: Response) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message || response.statusText;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

async function request<T>(path: string, options: RequestInit & { authKey?: string; picnicHeaders?: boolean } = {}) {
  const { authKey, picnicHeaders, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: { ...headers(authKey, picnicHeaders), ...(requestOptions.headers || {}) },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;

  const body = await response.text();
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

export async function loginToPicnic(username: string, password: string) {
  const secret = createHash("md5").update(password, "utf8").digest("hex");
  const response = await fetch(`${API_URL}/user/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ key: username, secret, client_id: 30100 }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json() as { second_factor_authentication_required?: boolean };
  const authKey = response.headers.get("x-picnic-auth");
  if (!authKey) throw new Error("Picnic stuurde geen geldige sessiesleutel terug.");

  return { authKey, requires2FA: Boolean(data.second_factor_authentication_required) };
}

export async function generatePicnic2FACode(authKey: string) {
  await request<undefined>("/user/2fa/generate", {
    method: "POST",
    authKey,
    picnicHeaders: true,
    body: JSON.stringify({ channel: "SMS" }),
  });
}

export async function verifyPicnic2FA(authKey: string, code: string) {
  const response = await fetch(`${API_URL}/user/2fa/verify`, {
    method: "POST",
    headers: headers(authKey, true),
    body: JSON.stringify({ otp: code }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(await readError(response));
  const verifiedAuthKey = response.headers.get("x-picnic-auth");
  if (!verifiedAuthKey) throw new Error("Picnic stuurde na de verificatie geen sessiesleutel terug.");
  return verifiedAuthKey;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectSellingUnits(value: unknown, products: PicnicProduct[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSellingUnits(item, products));
    return;
  }
  if (!isRecord(value)) return;

  const sellingUnit = value.sellingUnit;
  if (isRecord(sellingUnit)) {
    const id = typeof sellingUnit.id === "string" ? sellingUnit.id : "";
    const name = typeof sellingUnit.name === "string" ? sellingUnit.name : "";
    if (id && name && !products.some((product) => product.id === id)) {
      products.push({
        id,
        name,
        priceCents: typeof sellingUnit.display_price === "number" ? sellingUnit.display_price : 0,
        unitQuantity: typeof sellingUnit.unit_quantity === "string" ? sellingUnit.unit_quantity : "",
        maxCount: typeof sellingUnit.max_count === "number" ? sellingUnit.max_count : 99,
      });
    }
  }

  Object.values(value).forEach((item) => collectSellingUnits(item, products));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchScore(query: string, productName: string) {
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(productName);
  if (normalizedName === normalizedQuery) return 100;

  const tokens = normalizedQuery.split(" ").filter((token) => token.length > 1);
  const overlap = tokens.filter((token) => normalizedName.includes(token)).length;
  return overlap * 12 + (normalizedName.startsWith(normalizedQuery) ? 20 : 0) + (normalizedName.includes(normalizedQuery) ? 15 : 0);
}

function toBaseQuantity(amount: number, unit: string) {
  const normalizedUnit = normalize(unit);
  if (["kg", "kilo", "kilogram"].includes(normalizedUnit)) return { kind: "weight", value: amount * 1000 };
  if (["g", "gram"].includes(normalizedUnit)) return { kind: "weight", value: amount };
  if (["l", "liter"].includes(normalizedUnit)) return { kind: "volume", value: amount * 1000 };
  if (["cl"].includes(normalizedUnit)) return { kind: "volume", value: amount * 10 };
  if (["ml", "milliliter"].includes(normalizedUnit)) return { kind: "volume", value: amount };
  if (["stuk", "stuks", "st", "x"].includes(normalizedUnit)) return { kind: "count", value: amount };
  return null;
}

function parsePackageQuantity(label: string) {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(",", ".")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|cl|ml|stuks|stuk|st|x)\b/);
  if (!match) return null;
  return toBaseQuantity(Number(match[1]), match[2]);
}

export function estimatePicnicQuantity(item: PicnicShoppingItemInput, product: PicnicProduct) {
  if (item.amount === null || item.amount <= 0) return 1;
  const requested = toBaseQuantity(item.amount, item.unit);
  const packaged = parsePackageQuantity(product.unitQuantity);
  if (!requested || !packaged || requested.kind !== packaged.kind || packaged.value <= 0) return 1;
  return Math.max(1, Math.min(product.maxCount || 99, Math.ceil(requested.value / packaged.value)));
}

export async function searchPicnicProducts(authKey: string, query: string) {
  const response = await request<unknown>(`/pages/search-page-results?search_term=${encodeURIComponent(query)}`, {
    method: "GET",
    authKey,
    picnicHeaders: true,
  });
  const products: PicnicProduct[] = [];
  collectSellingUnits(response, products);
  return products.sort((a, b) => matchScore(query, b.name) - matchScore(query, a.name)).slice(0, 3);
}

export async function logoutFromPicnic(authKey: string) {
  await request<undefined>("/user/logout", {
    method: "POST",
    authKey,
    picnicHeaders: true,
  });
}

export async function addProductsToPicnicCart(authKey: string, products: Array<{ productId: string; quantity: number }>) {
  const body: Record<string, number> = {};
  products.forEach(({ productId, quantity }) => {
    const safeQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));
    body[productId] = Math.min(99, (body[productId] || 0) + safeQuantity);
  });

  return request<unknown>("/cart/products/add", {
    method: "POST",
    authKey,
    picnicHeaders: true,
    body: JSON.stringify(body),
  });
}

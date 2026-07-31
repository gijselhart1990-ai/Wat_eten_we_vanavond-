import { NextRequest, NextResponse } from "next/server";
import { getPicnicAuthKey, safePicnicError } from "../../../../lib/picnic/api";
import { estimatePicnicQuantity, searchPicnicProducts } from "../../../../lib/picnic/client";
import type { PicnicMatchResponse, PicnicShoppingItemInput } from "../../../../lib/picnic/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanItem(value: unknown): PicnicShoppingItemInput | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id.slice(0, 180) : "";
  const name = typeof item.name === "string" ? item.name.trim().slice(0, 120) : "";
  const unit = typeof item.unit === "string" ? item.unit.trim().slice(0, 30) : "";
  const amount = item.amount === null ? null : typeof item.amount === "number" && Number.isFinite(item.amount) ? item.amount : null;
  if (!id || !name) return null;
  return { id, name, amount, unit };
}

async function mapWithConcurrency<T, R>(values: T[], concurrency: number, mapper: (value: T) => Promise<R>) {
  const results = new Array<R>(values.length);
  let cursor = 0;

  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const authKey = getPicnicAuthKey(request);
    const body = await request.json().catch(() => null) as { items?: unknown } | null;
    const values = Array.isArray(body?.items) ? body.items : [];
    const items = values.map(cleanItem).filter((item): item is PicnicShoppingItemInput => Boolean(item)).slice(0, 40);

    if (!items.length) {
      return NextResponse.json({ error: "Er staan geen boodschappen klaar om te koppelen." }, { status: 400 });
    }

    const matches = await mapWithConcurrency(items, 3, async (item) => {
      const products = await searchPicnicProducts(authKey, item.name);
      return {
        item,
        options: products.map((product) => ({
          ...product,
          suggestedQuantity: estimatePicnicQuantity(item, product),
        })),
      };
    });

    return NextResponse.json({ matches } satisfies PicnicMatchResponse);
  } catch (error) {
    return NextResponse.json({ error: safePicnicError(error) }, { status: 400 });
  }
}

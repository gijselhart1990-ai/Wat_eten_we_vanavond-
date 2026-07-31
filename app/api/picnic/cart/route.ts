import { NextRequest, NextResponse } from "next/server";
import { getPicnicAuthKey, safePicnicError } from "../../../../lib/picnic/api";
import { addProductsToPicnicCart } from "../../../../lib/picnic/client";
import type { PicnicCartSelection } from "../../../../lib/picnic/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanSelection(value: unknown): PicnicCartSelection | null {
  if (!value || typeof value !== "object") return null;
  const selection = value as Record<string, unknown>;
  const productId = typeof selection.productId === "string" ? selection.productId.trim().slice(0, 100) : "";
  const quantity = typeof selection.quantity === "number" && Number.isFinite(selection.quantity)
    ? Math.max(1, Math.min(99, Math.floor(selection.quantity)))
    : 0;
  if (!productId || !quantity) return null;
  return { productId, quantity };
}

export async function POST(request: NextRequest) {
  try {
    const authKey = getPicnicAuthKey(request);
    const body = await request.json().catch(() => null) as { selections?: unknown } | null;
    const values = Array.isArray(body?.selections) ? body.selections : [];
    const selections = values.map(cleanSelection).filter((selection): selection is PicnicCartSelection => Boolean(selection)).slice(0, 40);

    if (!selections.length) {
      return NextResponse.json({ error: "Selecteer minimaal één Picnic-product." }, { status: 400 });
    }

    await addProductsToPicnicCart(authKey, selections);
    return NextResponse.json({ ok: true, added: selections.length });
  } catch (error) {
    return NextResponse.json({ error: safePicnicError(error) }, { status: 400 });
  }
}

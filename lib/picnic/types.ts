export interface PicnicProduct {
  id: string;
  name: string;
  priceCents: number;
  unitQuantity: string;
  maxCount: number;
}

export interface PicnicShoppingItemInput {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
}

export interface PicnicProductOption extends PicnicProduct {
  suggestedQuantity: number;
}

export interface PicnicProductMatch {
  item: PicnicShoppingItemInput;
  options: PicnicProductOption[];
}

export interface PicnicMatchResponse {
  matches: PicnicProductMatch[];
}

export interface PicnicCartSelection {
  productId: string;
  quantity: number;
}

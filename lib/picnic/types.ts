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

export interface PicnicProductMatch {
  item: PicnicShoppingItemInput;
  options: PicnicProduct[];
  suggestedQuantity: number;
}

export interface PicnicMatchResponse {
  matches: PicnicProductMatch[];
}

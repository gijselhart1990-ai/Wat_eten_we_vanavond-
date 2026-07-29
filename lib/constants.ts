import type { CategoryCode, WeekDay } from "./types";

export const DAYS: WeekDay[] = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
export const CATEGORIES: Record<CategoryCode, string> = {
  gf: "Groente & fruit",
  vv: "Vlees & vis",
  zk: "Zuivel & kaas",
  pg: "Pasta, rijst & granen",
  br: "Brood",
  sk: "Sauzen & kruiden",
  ov: "Overig",
};
export const CATEGORY_ORDER: CategoryCode[] = ["gf", "vv", "zk", "pg", "br", "sk", "ov"];

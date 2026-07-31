import { CATEGORY_ORDER, CATEGORIES } from "./constants";
import type { CategoryCode, CustomShoppingItem, PortionOverrides, Recipe, WeekPlan } from "./types";

export interface ShoppingQuantity {
  amount: number;
  unit: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  category: CategoryCode;
  quantities?: ShoppingQuantity[];
  unspecifiedAmount?: boolean;
  custom?: boolean;
}

type QuantityDefinition = {
  key: string;
  unit: string;
  factor: number;
  rank: number;
};

type MergedShoppingItem = ShoppingItem & {
  quantityMap: Map<string, ShoppingQuantity & { rank: number }>;
  unspecifiedAmount: boolean;
};

const PRODUCT_ALIASES: Record<string, string> = {
  komkommers: "komkommer",
  kipfilets: "kipfilet",
  tomaten: "tomaat",
  tomaatjes: "tomaat",
  cherrytomaten: "cherrytomaatjes",
  uien: "ui",
  "rode uien": "rode ui",
  "lente uien": "lente ui",
  "lente uitjes": "lente ui",
  bosuitjes: "lente ui",
  aardappels: "aardappelen",
};

const UNIT_DEFINITIONS: Record<string, QuantityDefinition> = {
  g: { key: "weight", unit: "g", factor: 1, rank: 1 },
  gram: { key: "weight", unit: "g", factor: 1, rank: 1 },
  kg: { key: "weight", unit: "g", factor: 1000, rank: 1 },
  kilo: { key: "weight", unit: "g", factor: 1000, rank: 1 },
  kilogram: { key: "weight", unit: "g", factor: 1000, rank: 1 },
  ml: { key: "volume", unit: "ml", factor: 1, rank: 2 },
  cl: { key: "volume", unit: "ml", factor: 10, rank: 2 },
  dl: { key: "volume", unit: "ml", factor: 100, rank: 2 },
  l: { key: "volume", unit: "ml", factor: 1000, rank: 2 },
  liter: { key: "volume", unit: "ml", factor: 1000, rank: 2 },
  stuk: { key: "count", unit: "stuk", factor: 1, rank: 0 },
  stuks: { key: "count", unit: "stuk", factor: 1, rank: 0 },
  st: { key: "count", unit: "stuk", factor: 1, rank: 0 },
  x: { key: "count", unit: "stuk", factor: 1, rank: 0 },
  teen: { key: "clove", unit: "teen", factor: 1, rank: 3 },
  tenen: { key: "clove", unit: "teen", factor: 1, rank: 3 },
  el: { key: "tablespoon", unit: "el", factor: 1, rank: 4 },
  eetlepel: { key: "tablespoon", unit: "el", factor: 1, rank: 4 },
  eetlepels: { key: "tablespoon", unit: "el", factor: 1, rank: 4 },
  tl: { key: "teaspoon", unit: "tl", factor: 1, rank: 4 },
  theelepel: { key: "teaspoon", unit: "tl", factor: 1, rank: 4 },
  theelepels: { key: "teaspoon", unit: "tl", factor: 1, rank: 4 },
  cup: { key: "cup", unit: "cup", factor: 1, rank: 5 },
  cups: { key: "cup", unit: "cup", factor: 1, rank: 5 },
  handje: { key: "handful", unit: "handje", factor: 1, rank: 6 },
  handjes: { key: "handful", unit: "handje", factor: 1, rank: 6 },
  plak: { key: "slice", unit: "plak", factor: 1, rank: 6 },
  plakken: { key: "slice", unit: "plak", factor: 1, rank: 6 },
  zak: { key: "bag", unit: "zak", factor: 1, rank: 6 },
  zakken: { key: "bag", unit: "zak", factor: 1, rank: 6 },
  takje: { key: "sprig", unit: "takje", factor: 1, rank: 6 },
  takjes: { key: "sprig", unit: "takje", factor: 1, rank: 6 },
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function productKey(name: string) {
  const normalized = normalize(name);
  return PRODUCT_ALIASES[normalized] || normalized;
}

function quantityDefinition(unit: string): QuantityDefinition {
  const normalized = normalize(unit);
  return UNIT_DEFINITIONS[normalized] || {
    key: `unit:${normalized || "none"}`,
    unit: unit.trim(),
    factor: 1,
    rank: 10,
  };
}

function numberLabel(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100).replace(".", ",");
}

export function formatAmount(amount: number | null, unit: string) {
  if (amount === null) return "naar smaak";
  const normalizedUnit = normalize(unit);
  if (["stuk", "stuks", "st", "x"].includes(normalizedUnit)) return `${numberLabel(amount)}x`;
  if (["g", "gram"].includes(normalizedUnit) && amount >= 1000) return `${numberLabel(amount / 1000)} kg`;
  if (normalizedUnit === "ml" && amount >= 1000) return `${numberLabel(amount / 1000)} l`;
  return [numberLabel(amount), unit].filter(Boolean).join(" ");
}

export function formatShoppingItemAmount(item: ShoppingItem) {
  const labels = item.quantities?.map((quantity) => formatAmount(quantity.amount, quantity.unit)) || [];
  if (!labels.length && item.amount !== null) labels.push(formatAmount(item.amount, item.unit));
  if (item.unspecifiedAmount || !labels.length) labels.push("naar smaak");
  return labels.join(" + ");
}

function addQuantity(item: MergedShoppingItem, amount: number | null, unit: string) {
  if (amount === null) {
    item.unspecifiedAmount = true;
    return;
  }

  const definition = quantityDefinition(unit);
  const convertedAmount = amount * definition.factor;
  const existing = item.quantityMap.get(definition.key);

  if (existing) {
    existing.amount += convertedAmount;
  } else {
    item.quantityMap.set(definition.key, {
      amount: convertedAmount,
      unit: definition.unit,
      rank: definition.rank,
    });
  }
}

function finalizeItem(item: MergedShoppingItem): ShoppingItem {
  const quantities = [...item.quantityMap.values()]
    .sort((left, right) => left.rank - right.rank || left.unit.localeCompare(right.unit, "nl"))
    .map(({ amount, unit }) => ({ amount, unit }));
  const primary = quantities[0];

  return {
    id: item.id,
    name: item.name,
    amount: primary?.amount ?? null,
    unit: primary?.unit ?? "",
    category: item.category,
    quantities,
    unspecifiedAmount: item.unspecifiedAmount,
  };
}

export function buildShoppingList(
  week: WeekPlan,
  portions: PortionOverrides,
  recipes: Recipe[],
  customItems: CustomShoppingItem[] = [],
) {
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const merged = new Map<string, MergedShoppingItem>();

  Object.entries(week).forEach(([day, recipeIds]) => {
    recipeIds.forEach((recipeId, index) => {
      const recipe = recipeById.get(recipeId);
      if (!recipe) return;
      const key = `${day}-${index}`;
      const scale = (portions[key] || recipe.serv) / recipe.serv;

      recipe.ing.forEach((ingredient) => {
        const mergeKey = productKey(ingredient.n);
        const existing = merged.get(mergeKey);
        const amount = ingredient.a === null ? null : ingredient.a * scale;

        if (existing) {
          if (ingredient.n.trim().length < existing.name.length) existing.name = ingredient.n.trim();
          addQuantity(existing, amount, ingredient.u);
          return;
        }

        const item: MergedShoppingItem = {
          id: `ingredient::${mergeKey}`,
          name: ingredient.n.trim(),
          amount: null,
          unit: "",
          category: ingredient.c,
          quantityMap: new Map(),
          unspecifiedAmount: false,
        };
        addQuantity(item, amount, ingredient.u);
        merged.set(mergeKey, item);
      });
    });
  });

  const items: ShoppingItem[] = [...merged.values()].map(finalizeItem);

  customItems.forEach((item) => {
    items.push({
      id: `custom::${item.id}`,
      name: item.name,
      amount: null,
      unit: "",
      category: item.category,
      custom: true,
    });
  });

  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORIES[category],
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length);
}

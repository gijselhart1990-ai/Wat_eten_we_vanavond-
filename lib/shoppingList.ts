import { CATEGORY_ORDER, CATEGORIES } from "./constants";
import type { CategoryCode, CustomShoppingItem, PortionOverrides, Recipe, WeekPlan } from "./types";

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  category: CategoryCode;
  custom?: boolean;
}

function numberLabel(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100).replace(".", ",");
}

export function formatAmount(amount: number | null, unit: string) {
  if (amount === null) return "naar smaak";
  return [numberLabel(amount), unit].filter(Boolean).join(" ");
}

export function buildShoppingList(
  week: WeekPlan,
  portions: PortionOverrides,
  recipes: Recipe[],
  customItems: CustomShoppingItem[] = [],
) {
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const merged = new Map<string, ShoppingItem>();

  Object.entries(week).forEach(([day, recipeIds]) => {
    recipeIds.forEach((recipeId, index) => {
      const recipe = recipeById.get(recipeId);
      if (!recipe) return;
      const key = `${day}-${index}`;
      const scale = (portions[key] || recipe.serv) / recipe.serv;
      recipe.ing.forEach((ingredient) => {
        const mergeKey = `${ingredient.n.toLowerCase()}::${ingredient.u}`;
        const existing = merged.get(mergeKey);
        const amount = ingredient.a === null ? null : ingredient.a * scale;
        if (existing) {
          existing.amount = existing.amount === null || amount === null ? null : existing.amount + amount;
        } else {
          merged.set(mergeKey, {
            id: mergeKey,
            name: ingredient.n,
            amount,
            unit: ingredient.u,
            category: ingredient.c,
          });
        }
      });
    });
  });

  customItems.forEach((item) => {
    merged.set(`custom::${item.id}`, {
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
    items: [...merged.values()].filter((item) => item.category === category),
  })).filter((group) => group.items.length);
}

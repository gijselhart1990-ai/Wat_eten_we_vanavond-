export type CategoryCode = "gf" | "vv" | "zk" | "pg" | "br" | "sk" | "ov";

export interface Ingredient {
  n: string;
  a: number | null;
  u: string;
  c: CategoryCode;
}

export interface Recipe {
  id: string;
  name: string;
  source: string;
  type: "Bowl" | "Wrap" | "Pasta" | "Oven" | "Plate" | "Flatbread" | "Sandwich";
  time: number;
  serv: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  est?: boolean;
  base: string;
  pal: string[];
  drizzle?: boolean;
  ing: Ingredient[];
  steps: string[];
  photo: string;
}

export type WeekDay = "Ma" | "Di" | "Wo" | "Do" | "Vr" | "Za" | "Zo";
export type WeekPlan = Record<WeekDay, string[]>;
export type PortionOverrides = Record<string, number>;

export interface CustomShoppingItem {
  id: string;
  name: string;
  category: CategoryCode;
}

export interface PlannerState {
  week: WeekPlan;
  weekPortions: PortionOverrides;
  shoppingList: CustomShoppingItem[];
  checked: Record<string, boolean>;
  favorites: string[];
}

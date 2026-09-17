import { DAYS } from "./constants";
import type { PortionOverrides, WeekPlan } from "./types";
import { RECIPES } from "./recipes";

// Het gecureerde weekmenu (zie ook /weekmenu.html). De recept-id's staan in
// dagvolgorde (maandag t/m zondag) en verwijzen naar recepten in de database,
// zodat het weekmenu in de weekplanner geladen kan worden en de boodschappen-
// lijst zich automatisch vult.
export const WEEKMENU = {
  id: "w38",
  title: "Weekmenu 14 - 20 september",
  href: "/weekmenu.html",
  recipeIds: [
    "wm-teriyaki-kipnoedels",
    "wm-pasta-tomaat-champignon-mozzarella",
    "wm-wraps-rundergehakt",
    "wm-zalm-couscous",
    "wm-kipshoarma-turks-brood",
    "wm-gehaktballetjes-puree-broccoli",
    "wm-groentecurry-kikkererwten",
  ],
};

// Bouwt een lege weekplanning met het weekmenu erin: elke dag krijgt het
// bijbehorende gerecht, met de standaardportie van dat recept.
export function buildWeekmenuPlan(): { week: WeekPlan; weekPortions: PortionOverrides } {
  const week: WeekPlan = { Ma: [], Di: [], Wo: [], Do: [], Vr: [], Za: [], Zo: [] };
  const weekPortions: PortionOverrides = {};
  DAYS.forEach((day, index) => {
    const id = WEEKMENU.recipeIds[index];
    const recipe = RECIPES.find((item) => item.id === id);
    if (!recipe) return;
    week[day] = [id];
    weekPortions[`${day}-0`] = recipe.serv;
  });
  return { week, weekPortions };
}

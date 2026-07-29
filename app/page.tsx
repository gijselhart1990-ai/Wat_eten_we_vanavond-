"use client";

import { useCallback, useState } from "react";
import { Header, type Tab } from "../components/Header";
import { PlannerTab } from "../components/PlannerTab";
import { RecipeDetailModal } from "../components/RecipeDetailModal";
import { RecipeGrid } from "../components/RecipeGrid";
import { ShoppingTab } from "../components/ShoppingTab";
import { DAYS } from "../lib/constants";
import { RECIPES } from "../lib/recipes";
import { usePlannerStorage } from "../lib/storage";
import type { CategoryCode, Recipe, WeekDay } from "../lib/types";

export default function Home() {
  const [tab, setTab] = useState<Tab>("recepten");
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const { state, setState, ready } = usePlannerStorage();

  const toggleFavorite = useCallback((id: string) => setState((current) => ({
    ...current,
    favorites: current.favorites.includes(id) ? current.favorites.filter((favorite) => favorite !== id) : [...current.favorites, id],
  })), [setState]);

  const addToDay = useCallback((day: WeekDay, recipe: Recipe, portions = recipe.serv) => setState((current) => {
    const index = current.week[day].length;
    return {
      ...current,
      week: { ...current.week, [day]: [...current.week[day], recipe.id] },
      weekPortions: { ...current.weekPortions, [`${day}-${index}`]: portions },
    };
  }), [setState]);

  const removeFromDay = useCallback((day: WeekDay, index: number) => setState((current) => {
    const before = current.week[day];
    const week = { ...current.week, [day]: before.filter((_, itemIndex) => itemIndex !== index) };
    const weekPortions = { ...current.weekPortions };
    before.forEach((_, itemIndex) => {
      const source = `${day}-${itemIndex}`;
      if (itemIndex < index) return;
      if (itemIndex === index) delete weekPortions[source];
      else {
        const destination = `${day}-${itemIndex - 1}`;
        if (weekPortions[source]) weekPortions[destination] = weekPortions[source];
        else delete weekPortions[destination];
        delete weekPortions[source];
      }
    });
    return { ...current, week, weekPortions };
  }), [setState]);

  const changePortions = useCallback((day: WeekDay, index: number, portions: number) => setState((current) => ({ ...current, weekPortions: { ...current.weekPortions, [`${day}-${index}`]: portions } })), [setState]);

  const fillSuggestions = useCallback(() => setState((current) => {
    const choices = [RECIPES[0], RECIPES[2], RECIPES[6], RECIPES[9], RECIPES[12], RECIPES[14], RECIPES[16]];
    const week = { ...current.week };
    const weekPortions = { ...current.weekPortions };
    DAYS.forEach((day, index) => {
      const recipe = choices[index];
      week[day] = [recipe.id];
      weekPortions[`${day}-0`] = recipe.serv;
    });
    return { ...current, week, weekPortions };
  }), [setState]);

  const addCustomItem = useCallback((name: string, category: CategoryCode) => setState((current) => ({
    ...current,
    shoppingList: [...current.shoppingList, { id: crypto.randomUUID(), name, category }],
  })), [setState]);

  return (
    <main>
      <Header tab={tab} onTabChange={setTab} />
      {!ready ? <div className="loading">Je planner wordt geladen…</div> : <>
        {tab === "recepten" && <RecipeGrid recipes={RECIPES} favorites={state.favorites} onToggleFavorite={toggleFavorite} onOpen={setOpenRecipe} />}
        {tab === "planner" && <PlannerTab week={state.week} portions={state.weekPortions} recipes={RECIPES} onAdd={addToDay} onRemove={removeFromDay} onPortions={changePortions} onFillSuggestions={fillSuggestions} />}
        {tab === "boodschappen" && <ShoppingTab week={state.week} portions={state.weekPortions} recipes={RECIPES} customItems={state.shoppingList} checked={state.checked} onToggle={(id) => setState((current) => ({ ...current, checked: { ...current.checked, [id]: !current.checked[id] } }))} onAddCustom={addCustomItem} onRemoveCustom={(id) => setState((current) => ({ ...current, shoppingList: current.shoppingList.filter((item) => item.id !== id) }))} />}
      </>}
      {openRecipe && <RecipeDetailModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} onAdd={(recipe, portions) => { addToDay("Ma", recipe, portions); setOpenRecipe(null); setTab("planner"); }} />}
    </main>
  );
}

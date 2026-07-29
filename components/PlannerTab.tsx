"use client";

import { useMemo, useState } from "react";
import { DAYS } from "../lib/constants";
import type { PortionOverrides, Recipe, WeekDay, WeekPlan } from "../lib/types";
import { DayPicker } from "./DayPicker";

const longDays: Record<WeekDay, string> = { Ma: "Maandag", Di: "Dinsdag", Wo: "Woensdag", Do: "Donderdag", Vr: "Vrijdag", Za: "Zaterdag", Zo: "Zondag" };

export function PlannerTab({
  week,
  portions,
  recipes,
  onAdd,
  onRemove,
  onPortions,
  onFillSuggestions,
}: {
  week: WeekPlan;
  portions: PortionOverrides;
  recipes: Recipe[];
  onAdd: (day: WeekDay, recipe: Recipe, portions?: number) => void;
  onRemove: (day: WeekDay, index: number) => void;
  onPortions: (day: WeekDay, index: number, portions: number) => void;
  onFillSuggestions: () => void;
}) {
  const [pickerDay, setPickerDay] = useState<WeekDay | null>(null);
  const byId = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes]);
  const plannedMeals = DAYS.reduce((total, day) => total + week[day].length, 0);

  return (
    <section className="view">
      <div className="page-intro planner-intro">
        <div><span className="eyebrow">Jouw week op een bord</span><h1>Weekplanner</h1><p>Plan maaltijden, pas porties aan en zie direct je dagelijkse macro&apos;s.</p></div>
        <button className="secondary-button" onClick={onFillSuggestions}>✦ Vul met suggesties</button>
      </div>
      <div className="planner-summary"><span><b>{plannedMeals}</b> geplande maaltijd{plannedMeals === 1 ? "" : "en"}</span><span>•</span><span>Alles komt automatisch op je boodschappenlijst</span></div>
      <div className="week-grid">
        {DAYS.map((day) => {
          const meals = week[day].map((id, index) => ({ recipe: byId.get(id), index })).filter((meal): meal is { recipe: Recipe; index: number } => Boolean(meal.recipe));
          const totals = meals.reduce((acc, { recipe, index }) => {
            const scale = (portions[`${day}-${index}`] || recipe.serv) / recipe.serv;
            return { kcal: acc.kcal + recipe.kcal * scale, p: acc.p + recipe.p * scale };
          }, { kcal: 0, p: 0 });
          return (
            <article className="day-card" key={day}>
              <header><span className="day-name">{longDays[day]}</span><span className="day-short">{day}</span></header>
              <div className="day-meals">
                {meals.map(({ recipe, index }) => {
                  const current = portions[`${day}-${index}`] || recipe.serv;
                  return <div className="planned-meal" key={`${recipe.id}-${index}`}>
                    <div><strong>{recipe.name}</strong><small>{Math.round(recipe.kcal * current / recipe.serv)} kcal · {Math.round(recipe.p * current / recipe.serv)}g eiwit</small></div>
                    <div className="meal-actions"><div className="compact-stepper"><button onClick={() => onPortions(day, index, Math.max(1, current - 1))} aria-label="Minder porties">−</button><span>{current}p</span><button onClick={() => onPortions(day, index, current + 1)} aria-label="Meer porties">+</button></div><button onClick={() => onRemove(day, index)} className="remove-meal" aria-label={`${recipe.name} verwijderen`}>×</button></div>
                  </div>;
                })}
                {!meals.length && <p className="day-empty">Nog niets gepland</p>}
              </div>
              <button className="add-meal" onClick={() => setPickerDay(day)}>＋ Maaltijd toevoegen</button>
              <footer><span>{Math.round(totals.kcal)} kcal</span><span>{Math.round(totals.p)}g eiwit</span></footer>
            </article>
          );
        })}
      </div>
      {pickerDay && <DayPicker day={longDays[pickerDay]} recipes={recipes} onClose={() => setPickerDay(null)} onAdd={(recipe) => { onAdd(pickerDay, recipe); setPickerDay(null); }} />}
    </section>
  );
}

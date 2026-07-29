"use client";

import { useMemo, useState } from "react";
import type { Recipe } from "../lib/types";
import { DishPhoto } from "./DishPhoto";

export function DayPicker({ day, recipes, onAdd, onClose }: { day: string; recipes: Recipe[]; onAdd: (recipe: Recipe) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => recipes.filter((recipe) => `${recipe.name} ${recipe.source}`.toLowerCase().includes(query.toLowerCase())), [query, recipes]);
  return (
    <div className="picker-backdrop" onMouseDown={onClose}>
      <section className="day-picker" role="dialog" aria-modal="true" aria-label={`Recept toevoegen aan ${day}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="picker-heading"><div><span className="eyebrow">Weekplanner</span><h2>Toevoegen aan {day}</h2></div><button className="icon-button" onClick={onClose} aria-label="Sluiten">×</button></div>
        <label className="search picker-search"><span>⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek je recept…" /></label>
        <div className="picker-list">{results.map((recipe) => <button key={recipe.id} className="picker-recipe" onClick={() => onAdd(recipe)}><span className="picker-photo"><DishPhoto recipe={recipe} /></span><span><strong>{recipe.name}</strong><small>{recipe.time} min · {recipe.p}g eiwit</small></span><b>＋</b></button>)}</div>
      </section>
    </div>
  );
}

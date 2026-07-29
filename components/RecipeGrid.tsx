"use client";

import { useMemo, useState } from "react";
import { RECIPE_TYPES } from "../lib/recipes";
import type { Recipe } from "../lib/types";
import { RecipeCard } from "./RecipeCard";

export function RecipeGrid({
  recipes,
  favorites,
  onToggleFavorite,
  onOpen,
}: {
  recipes: Recipe[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpen: (recipe: Recipe) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Alles");
  const [quick, setQuick] = useState(false);
  const [protein, setProtein] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const filtered = useMemo(() => recipes.filter((recipe) => {
    const haystack = `${recipe.name} ${recipe.source} ${recipe.type}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase()))
      && (type === "Alles" || recipe.type === type)
      && (!quick || recipe.time <= 20)
      && (!protein || recipe.p >= 35)
      && (!onlyFavorites || favorites.includes(recipe.id));
  }), [favorites, onlyFavorites, protein, query, quick, recipes, type]);

  return (
    <section className="view">
      <div className="page-intro">
        <div><span className="eyebrow">De receptenbibliotheek</span><h1>Wat staat er op het menu?</h1><p>17 opgeslagen favorieten, klaar om te plannen.</p></div>
        <span className="count-pill">{filtered.length} gerechten</span>
      </div>
      <div className="filters">
        <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek een gerecht of maker…" /></label>
        <div className="filter-row" aria-label="Receptfilters">
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter op type">
            <option>Alles</option>
            {RECIPE_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className={quick ? "chip is-on" : "chip"} onClick={() => setQuick(!quick)}>≤ 20 min</button>
          <button className={protein ? "chip is-on" : "chip"} onClick={() => setProtein(!protein)}>Eiwitrijk</button>
          <button className={onlyFavorites ? "chip is-on" : "chip"} onClick={() => setOnlyFavorites(!onlyFavorites)}>♥ Favorieten</button>
        </div>
      </div>
      {filtered.length ? <div className="recipe-grid">
        {filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onFavorite={() => onToggleFavorite(recipe.id)} onOpen={() => onOpen(recipe)} />)}
      </div> : <div className="empty-state"><span>⌕</span><h2>Geen gerechten gevonden</h2><p>Probeer een andere zoekterm of filter.</p></div>}
    </section>
  );
}

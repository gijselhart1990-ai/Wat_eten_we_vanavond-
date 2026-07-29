"use client";

import type { Recipe } from "../lib/types";
import { DishPhoto } from "./DishPhoto";

export function RecipeCard({
  recipe,
  favorite,
  onFavorite,
  onOpen,
}: {
  recipe: Recipe;
  favorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="recipe-card">
      <button className="recipe-photo" onClick={onOpen} aria-label={`Bekijk ${recipe.name}`}>
        <DishPhoto recipe={recipe} />
        <span className="photo-shade" />
        <span className="time-badge">◷ {recipe.time} min</span>
      </button>
      <button
        className={`heart ${favorite ? "is-favorite" : ""}`}
        onClick={onFavorite}
        aria-label={favorite ? `${recipe.name} uit favorieten verwijderen` : `${recipe.name} als favoriet markeren`}
        aria-pressed={favorite}
      >
        {favorite ? "♥" : "♡"}
      </button>
      <button className="recipe-info" onClick={onOpen}>
        <span className="eyebrow">{recipe.type} · {recipe.source}</span>
        <strong>{recipe.name}</strong>
        <span className="card-macros">
          <span><b>{recipe.kcal}</b> kcal</span>
          <span><b>{recipe.p}g</b> eiwit</span>
          {recipe.est && <em>geschat</em>}
        </span>
      </button>
    </article>
  );
}

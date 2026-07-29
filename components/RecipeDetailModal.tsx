"use client";

import { useEffect, useState } from "react";
import { formatAmount } from "../lib/shoppingList";
import type { Recipe } from "../lib/types";
import { DishPhoto } from "./DishPhoto";
import { StepIcon } from "./StepIcon";

export function RecipeDetailModal({ recipe, onClose, onAdd }: { recipe: Recipe; onClose: () => void; onAdd: (recipe: Recipe, portions: number) => void }) {
  const [portions, setPortions] = useState(recipe.serv);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  const multiplier = portions / recipe.serv;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="recipe-modal" role="dialog" aria-modal="true" aria-label={recipe.name} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Sluiten">×</button>
        <div className="modal-hero"><DishPhoto recipe={recipe} priority /><div className="hero-overlay" /><div className="modal-title"><span>{recipe.type} · {recipe.source}</span><h2>{recipe.name}</h2><p>◷ {recipe.time} minuten · {recipe.serv} portie{recipe.serv !== 1 ? "s" : ""}</p></div></div>
        <div className="modal-content">
          <div className="macro-strip">
            <span><b>{Math.round(recipe.kcal * multiplier)}</b> kcal</span><span><b>{Math.round(recipe.p * multiplier)}g</b> eiwit</span><span><b>{Math.round(recipe.c * multiplier)}g</b> koolhydraten</span><span><b>{Math.round(recipe.f * multiplier)}g</b> vet</span>
          </div>
          {recipe.est && <p className="estimate">Macro&apos;s zijn geschat; de bronpost bevatte geen volledige gegevens.</p>}
          <div className="detail-section ingredients-section">
            <div className="section-heading"><div><span className="eyebrow">Boodschappen</span><h3>Ingrediënten</h3></div><div className="stepper" aria-label="Aantal porties"><button onClick={() => setPortions(Math.max(1, portions - 1))} aria-label="Minder porties">−</button><b>{portions}</b><span>porties</span><button onClick={() => setPortions(portions + 1)} aria-label="Meer porties">+</button></div></div>
            <ul className="ingredients">{recipe.ing.map((ingredient, index) => <li key={`${ingredient.n}-${index}`}><span>{ingredient.n}</span><b>{ingredient.a === null ? "naar smaak" : formatAmount(ingredient.a * multiplier, ingredient.u)}</b></li>)}</ul>
          </div>
          <div className="detail-section">
            <span className="eyebrow">Zo maak je het</span><h3>Kooktijdlijn</h3>
            <ol className="step-timeline">{recipe.steps.map((step, index) => <li key={step}><span className="step-number">{index + 1}</span><StepIcon step={step} /><p>{step}</p></li>)}</ol>
          </div>
          <button className="primary-button modal-add" onClick={() => onAdd(recipe, portions)}>＋ Voeg toe aan weekplanner</button>
        </div>
      </section>
    </div>
  );
}

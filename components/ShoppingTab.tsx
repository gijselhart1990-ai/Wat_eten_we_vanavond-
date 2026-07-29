"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_ORDER } from "../lib/constants";
import { buildShoppingList, formatAmount } from "../lib/shoppingList";
import type { CategoryCode, CustomShoppingItem, PortionOverrides, Recipe, WeekPlan } from "../lib/types";

export function ShoppingTab({
  week,
  portions,
  recipes,
  customItems,
  checked,
  onToggle,
  onAddCustom,
  onRemoveCustom,
}: {
  week: WeekPlan;
  portions: PortionOverrides;
  recipes: Recipe[];
  customItems: CustomShoppingItem[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
  onAddCustom: (name: string, category: CategoryCode) => void;
  onRemoveCustom: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryCode>("ov");
  const groups = useMemo(() => buildShoppingList(week, portions, recipes, customItems), [customItems, portions, recipes, week]);
  const items = groups.flatMap((group) => group.items);
  const completed = items.filter((item) => checked[item.id]).length;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onAddCustom(name.trim(), category);
    setName("");
  }

  return (
    <section className="view">
      <div className="page-intro shopping-intro"><div><span className="eyebrow">Alles in één keer</span><h1>Boodschappen</h1><p>Ingrediënten uit je week zijn automatisch samengevoegd en geschaald.</p></div><span className="count-pill">{completed}/{items.length} afgevinkt</span></div>
      <form className="custom-item-form" onSubmit={submit}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Voeg zelf iets toe…" aria-label="Nieuw boodschappenitem" /><select value={category} onChange={(event) => setCategory(event.target.value as CategoryCode)} aria-label="Categorie">{CATEGORY_ORDER.map((item) => <option key={item} value={item}>{CATEGORIES[item]}</option>)}</select><button className="primary-button" type="submit">＋ Toevoegen</button></form>
      {!items.length ? <div className="empty-state"><span>☷</span><h2>Je lijst is nog leeg</h2><p>Plan een maaltijd en de ingrediënten verschijnen hier automatisch.</p></div> : <div className="shopping-groups">{groups.map((group) => <section className="shopping-group" key={group.category}><h2>{group.label}<span>{group.items.length}</span></h2><ul>{group.items.map((item) => <li key={item.id} className={checked[item.id] ? "is-checked" : ""}><button className="check-button" onClick={() => onToggle(item.id)} aria-label={checked[item.id] ? `${item.name} niet meer afvinken` : `${item.name} afvinken`}>{checked[item.id] ? "✓" : ""}</button><span className="shopping-name">{item.name}</span><b>{item.custom ? "eigen item" : formatAmount(item.amount, item.unit)}</b>{item.custom && <button className="remove-custom" onClick={() => onRemoveCustom(item.id.replace("custom::", ""))} aria-label={`${item.name} verwijderen`}>×</button>}</li>)}</ul></section>)}</div>}
    </section>
  );
}

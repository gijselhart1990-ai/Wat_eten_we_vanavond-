"use client";

import Image from "next/image";
import { useState } from "react";
import type { Recipe } from "../lib/types";
import { DishArt } from "./DishArt";

export function DishPhoto({ recipe, priority = false, className = "" }: { recipe: Recipe; priority?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className={`dish-art-wrap ${className}`}><DishArt r={recipe} fill /></span>;
  }
  // Externe (gehotlinkte) foto's laden rechtstreeks in de browser van de
  // bezoeker; die omzeilen next/image zodat er geen server-side ophaal- of
  // domeinconfiguratie nodig is.
  if (/^https?:\/\//.test(recipe.photo)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={recipe.photo}
        alt={recipe.name}
        loading={priority ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return (
    <Image
      className={className}
      src={recipe.photo}
      alt={recipe.name}
      fill
      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}

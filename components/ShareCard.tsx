"use client";

import { forwardRef } from "react";
import { formatAmount } from "../lib/shoppingList";
import type { Recipe } from "../lib/types";

// Een zelfstandige, vaste-breedte kaart die naar een afbeelding wordt gerenderd
// om te delen of te bewaren. Bewust met inline stijlen zodat het renderen
// (html-to-image) niet afhankelijk is van externe stylesheets of fonts.
export const ShareCard = forwardRef<HTMLDivElement, { recipe: Recipe; portions: number }>(
  function ShareCard({ recipe, portions }, ref) {
    const multiplier = portions / recipe.serv;
    const font =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          background: "#17120c",
          color: "#f7efe2",
          fontFamily: font,
          overflow: "hidden",
        }}
      >
        {/* Foto met titel */}
        <div style={{ position: "relative", width: 1080, height: 720 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.photo}
            alt={recipe.name}
            crossOrigin="anonymous"
            style={{ width: 1080, height: 720, objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)",
            }}
          />
          <div style={{ position: "absolute", left: 56, right: 56, bottom: 44 }}>
            <div
              style={{
                textTransform: "uppercase",
                letterSpacing: 3,
                fontSize: 24,
                fontWeight: 700,
                color: "#f0b64a",
                marginBottom: 12,
              }}
            >
              {recipe.type} · {recipe.source}
            </div>
            <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.05 }}>{recipe.name}</div>
            <div style={{ fontSize: 30, marginTop: 16, color: "#e6dccb" }}>
              ◷ {recipe.time} minuten · {portions} portie{portions !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div style={{ padding: "44px 56px 20px" }}>
          {/* Macro's */}
          <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
            {[
              [Math.round(recipe.kcal * multiplier), "kcal"],
              [`${Math.round(recipe.p * multiplier)}g`, "eiwit"],
              [`${Math.round(recipe.c * multiplier)}g`, "koolhydraten"],
              [`${Math.round(recipe.f * multiplier)}g`, "vet"],
            ].map(([value, label]) => (
              <div
                key={label as string}
                style={{
                  flex: 1,
                  background: "#211a11",
                  border: "1px solid #35291a",
                  borderRadius: 18,
                  padding: "22px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 40, fontWeight: 800, color: "#f0b64a" }}>{value}</div>
                <div style={{ fontSize: 22, color: "#c9bca6", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Ingrediënten */}
          <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 18 }}>Ingrediënten</div>
          <div style={{ columnCount: 2, columnGap: 48, marginBottom: 40 }}>
            {recipe.ing.map((ingredient, index) => (
              <div
                key={`${ingredient.n}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "12px 0",
                  borderBottom: "1px solid #2c2216",
                  breakInside: "avoid",
                  fontSize: 27,
                }}
              >
                <span style={{ color: "#efe6d6" }}>{ingredient.n}</span>
                <b style={{ color: "#f0b64a", whiteSpace: "nowrap" }}>
                  {ingredient.a === null ? "naar smaak" : formatAmount(ingredient.a * multiplier, ingredient.u)}
                </b>
              </div>
            ))}
          </div>

          {/* Stappen */}
          <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 18 }}>Zo maak je het</div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {recipe.steps.map((step, index) => (
              <li key={step} style={{ display: "flex", gap: 20, marginBottom: 18, breakInside: "avoid" }}>
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#f0b64a",
                    color: "#17120c",
                    fontWeight: 800,
                    fontSize: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {index + 1}
                </span>
                <p style={{ margin: 0, fontSize: 27, lineHeight: 1.4, color: "#e9dfce" }}>{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div
          style={{
            padding: "22px 56px 40px",
            fontSize: 26,
            fontWeight: 700,
            color: "#f0b64a",
          }}
        >
          Wat eten we vanavond?
        </div>
      </div>
    );
  },
);

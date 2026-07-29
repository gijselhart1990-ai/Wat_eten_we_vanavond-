import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync("C:/Users/S07494/.codex/attachments/b4b2a742-510c-4903-94aa-a9d128f32dda/pasted-text.txt", "utf8");
const output = path.resolve("public/dishes");
fs.mkdirSync(output, { recursive: true });

const recipesBlock = source.match(/const RECIPES = (\[[\s\S]*?\n\]);\r?\n\r?\nconst DAYS/);
if (!recipesBlock) throw new Error("De receptendataset kon niet worden gevonden.");
const recipes = recipesBlock[1].replace(/\r/g, "");
const typed = `import type { Recipe } from "./types";\n\nconst sourceRecipes: Omit<Recipe, "photo">[] = ${recipes.replace(/\n\];$/, "\n]").replace(/\n\s*$/, "")};\n\nexport const RECIPES: Recipe[] = sourceRecipes.map((recipe) => ({\n  ...recipe,\n  photo: \`/dishes/\${recipe.id}.jpg\`,\n}));\n\nexport const RECIPE_TYPES = Array.from(new Set(RECIPES.map((recipe) => recipe.type)));\n`;
fs.mkdirSync(path.resolve("lib"), { recursive: true });
fs.writeFileSync(path.resolve("lib/recipes.ts"), typed);

const photoBlock = source.match(/const PHOTO = \{([\s\S]*?)\n\};\r?\n\r?\nfunction DishPhoto/);
if (!photoBlock) throw new Error("De receptfoto's konden niet worden gevonden.");
const photoPattern = /"([^"]+)":\s*"data:image\/jpeg;base64,([^"]+)"/g;
for (const [, id, base64] of photoBlock[1].matchAll(photoPattern)) {
  fs.writeFileSync(path.join(output, `${id}.jpg`), Buffer.from(base64, "base64"));
}

const logo = source.match(/src="data:image\/png;base64,([^"]+)" alt="Logo"/);
if (!logo) throw new Error("Het logo kon niet worden gevonden.");
fs.mkdirSync(path.resolve("public"), { recursive: true });
fs.writeFileSync(path.resolve("public/logo.png"), Buffer.from(logo[1], "base64"));

const dish = source.match(/function Dish\(\{ r, size = 116, fill = false \}\) \{[\s\S]*?(?=\/\* ---------- Step icons)/);
if (!dish) throw new Error("De SVG-fallback kon niet worden gevonden.");
const dishComponent = `import type { Recipe } from "../lib/types";\n\nfunction seedRand(seed: string) {\n  let h = 1779033703 ^ seed.length;\n  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }\n  return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h = (h ^ (h >>> 16)) >>> 0; return h / 4294967296; };\n}\n\n${dish[0]
  .replace("function Dish({ r, size = 116, fill = false })", "export function DishArt({ r, size = 116, fill = false }: { r: Recipe; size?: number; fill?: boolean })")
  .replace("const scatter = (count, rx, ry, minR, maxR) => {", "const scatter = (count: number, rx: number, ry: number, minR: number, maxR: number) => {")
  .replace("const items = [];", "const items: { x: number; y: number; rr: number; col: string; rot: number }[] = [];")
  .replace(/\r/g, "")}`;
fs.mkdirSync(path.resolve("components"), { recursive: true });
fs.writeFileSync(path.resolve("components/DishArt.tsx"), dishComponent);

const icons = source.match(/function StepIcon\(\{ name \}\) \{[\s\S]*?\n\}\r?\n\r?\n(?=\/\* ---------- little UI atoms)/);
if (!icons) throw new Error("De stapiconen konden niet worden gevonden.");
const iconComponent = `import type { SVGProps } from "react";\nimport { classifyStep, type StepKind } from "../lib/stepClassifier";\n\n${icons[0]
  .replace("function StepIcon({ name })", "function PrototypeStepIcon({ name }: { name: string })")
  .replace('const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };', 'const p: SVGProps<SVGGElement> = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };')
  .replace("{paths[name] || paths.dot}", "{paths[name as keyof typeof paths] || paths.dot}")
  .replace(/\r/g, "")}\n\nconst names: Record<StepKind, string> = { oven: "oven", koken: "pot", bakken: "pan", snijden: "knife", kruiden: "season", mengen: "mix", wikkelen: "plate", serveren: "plate" };\n\nexport function StepIcon({ step, size = 24 }: { step: string; size?: number }) {\n  return <span className="step-icon" style={{ width: size, height: size }}><PrototypeStepIcon name={names[classifyStep(step)]} /></span>;\n}\n`;
fs.writeFileSync(path.resolve("components/StepIcon.tsx"), iconComponent);

console.log("Recepten, 17 foto's en logo zijn gemigreerd.");

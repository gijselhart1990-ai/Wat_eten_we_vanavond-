// Haalt passende foto's op bij Unsplash voor de gerechten die nog geen
// eigen foto in public/dishes/ hebben, en slaat ze op als
// public/dishes/<id>.jpg zodat de site ze net als de andere foto's toont.
//
// Waarom een apart script? De bouw-/preview-omgeving mag standaard geen
// externe foto-CDN's benaderen (Unsplash, Pexels, enz. geven daar 403).
// Draai dit script daarom in een sessie/omgeving waar api.unsplash.com en
// images.unsplash.com wél bereikbaar zijn.
//
// Gebruik:
//   1. Zet een gratis Unsplash access key als environment variable:
//        export UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//      (aanmaken op https://unsplash.com/developers -> "New Application")
//   2. Draai:  node scripts/fetch-photos.mjs
//   3. Controleer de nieuwe foto's, commit ze en push.
//
// Opties via environment variables:
//   UNSPLASH_ACCESS_KEY   verplicht: je Unsplash Access Key
//   FORCE=1               overschrijf ook gerechten die al een foto hebben
//   ONLY=id1,id2          beperk tot deze recept-id's
//
// Unsplash-richtlijnen die dit script naleeft:
//   - Elke download meldt zich bij het "download_location" endpoint
//     (verplicht volgens de API-voorwaarden).
//   - De fotograaf + Unsplash worden vermeld in scripts/photo-credits.json
//     zodat je de naamsvermelding op de site of in de repo kunt tonen.

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DISHES_DIR = join(ROOT, "public", "dishes");
const CREDITS_FILE = join(ROOT, "scripts", "photo-credits.json");

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const FORCE = process.env.FORCE === "1";
const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);

// Gerechten zonder eigen foto, met een Engelse zoekterm die goed bij Unsplash werkt.
// Voeg hier gerust regels toe voor nieuwe gerechten.
const QUERIES = {
  "gekaramelliseerde-uienpasta": "caramelized onion pasta",
  "wm-teriyaki-kipnoedels": "teriyaki chicken noodles",
  "wm-pasta-tomaat-champignon-mozzarella": "tomato mushroom mozzarella pasta",
  "wm-wraps-rundergehakt": "beef mince wraps tortilla",
  "wm-zalm-couscous": "salmon couscous vegetables",
  "wm-kipshoarma-turks-brood": "chicken shawarma flatbread",
  "wm-gehaktballetjes-puree-broccoli": "meatballs mashed potato broccoli",
  "wm-groentecurry-kikkererwten": "chickpea vegetable curry",
};

if (!ACCESS_KEY) {
  console.error(
    "Ontbrekende UNSPLASH_ACCESS_KEY.\n" +
      "Maak een gratis key aan op https://unsplash.com/developers en zet die als:\n" +
      "  export UNSPLASH_ACCESS_KEY=...\n",
  );
  process.exit(1);
}

mkdirSync(DISHES_DIR, { recursive: true });

const targets = Object.entries(QUERIES).filter(([id]) => {
  if (ONLY.length && !ONLY.includes(id)) return false;
  if (!FORCE && existsSync(join(DISHES_DIR, `${id}.jpg`))) {
    console.log(`• ${id}: heeft al een foto, overslaan (FORCE=1 om te overschrijven)`);
    return false;
  }
  return true;
});

if (!targets.length) {
  console.log("Niets te doen — alle gerechten hebben al een foto.");
  process.exit(0);
}

const credits = existsSync(CREDITS_FILE)
  ? JSON.parse(readFileSync(CREDITS_FILE, "utf8"))
  : {};

async function api(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}`, "Accept-Version": "v1" },
  });
  if (!res.ok) {
    throw new Error(`Unsplash gaf ${res.status} ${res.statusText} voor ${url}`);
  }
  return res.json();
}

async function fetchOne(id, query) {
  const search = new URL("https://api.unsplash.com/search/photos");
  search.searchParams.set("query", query);
  search.searchParams.set("per_page", "1");
  search.searchParams.set("orientation", "landscape");
  search.searchParams.set("content_filter", "high");

  const data = await api(search.toString());
  const photo = data.results?.[0];
  if (!photo) {
    console.warn(`⚠ ${id}: geen resultaat voor "${query}"`);
    return;
  }

  // Verplichte download-melding volgens de Unsplash API-voorwaarden.
  if (photo.links?.download_location) {
    try {
      await api(photo.links.download_location);
    } catch (err) {
      console.warn(`  (download-melding mislukt: ${err.message})`);
    }
  }

  const imgUrl = new URL(photo.urls.raw);
  imgUrl.searchParams.set("w", "1200");
  imgUrl.searchParams.set("q", "80");
  imgUrl.searchParams.set("fm", "jpg");
  imgUrl.searchParams.set("fit", "crop");

  const res = await fetch(imgUrl.toString());
  if (!res.ok) throw new Error(`Foto ophalen gaf ${res.status} voor ${id}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(DISHES_DIR, `${id}.jpg`), buf);

  credits[id] = {
    query,
    photographer: photo.user?.name,
    photographer_url: photo.user?.links?.html,
    unsplash_url: photo.links?.html,
  };
  console.log(`✓ ${id}: foto van ${photo.user?.name} (${(buf.length / 1024).toFixed(0)} kB)`);
}

let failures = 0;
for (const [id, query] of targets) {
  try {
    await fetchOne(id, query);
  } catch (err) {
    failures += 1;
    console.error(`✗ ${id}: ${err.message}`);
  }
}

writeFileSync(CREDITS_FILE, JSON.stringify(credits, null, 2) + "\n");
console.log(`\nCredits bijgewerkt in scripts/photo-credits.json`);
console.log(failures ? `Klaar met ${failures} fout(en).` : "Klaar. Vergeet niet te committen en pushen.");
process.exit(failures ? 1 : 0);

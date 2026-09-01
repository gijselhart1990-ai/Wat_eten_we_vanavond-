// Maakt screenshots van de app met de gerechten.
//
// Gebruik:
//   1. Start de app:            pnpm dev        (of: pnpm build && pnpm start)
//   2. Maak de screenshots:     pnpm screenshot
//
// Opties via environment variables:
//   BASE_URL     URL van de draaiende app        (standaard http://localhost:3000)
//   OUT_DIR      map voor de screenshots         (standaard ./screenshots)
//   CHROME_PATH  pad naar een Chrome/Chromium    (anders wordt er automatisch gezocht)
//   DETAILS=1    maak ook per gerecht een detail-screenshot (standaard alleen het overzicht)
//
// Vereist een Chromium/Chrome. In deze repo staat `playwright-core`; installeer
// eenmalig een browser met:  pnpm dlx playwright install chromium
// of wijs met CHROME_PATH naar een bestaande Chrome-installatie.

import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = process.env.OUT_DIR || "screenshots";
const WITH_DETAILS = process.env.DETAILS === "1";

function resolveChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  // Vooraf geïnstalleerde Playwright-browsers (o.a. in de Claude Code-omgeving).
  const pwRoot = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (existsSync(pwRoot)) {
    for (const dir of readdirSync(pwRoot).filter((d) => d.startsWith("chromium-"))) {
      const exe = join(pwRoot, dir, "chrome-linux", "chrome");
      if (existsSync(exe)) return exe;
    }
  }
  // Veelvoorkomende locaties op andere systemen.
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return undefined; // laat Playwright zelf zoeken (werkt als je `playwright install` deed)
}

const slug = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

mkdirSync(OUT_DIR, { recursive: true });

const executablePath = resolveChrome();
const browser = await chromium.launch({
  executablePath,
  args: ["--no-sandbox", "--disable-gpu"],
});

async function newPage(width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  // Externe hosts (fonts/analytics) blokkeren zodat de pagina niet blijft hangen.
  await page.route("**/*", (route) => {
    const u = route.request().url();
    return u.startsWith(BASE_URL) || u.startsWith("http://localhost") || u.startsWith("data:")
      ? route.continue()
      : route.abort();
  });
  return page;
}

// --- Overzicht (desktop) ---
const desktop = await newPage(1440, 1000);
await desktop.goto(BASE_URL, { waitUntil: "load", timeout: 45000 });
await desktop.waitForSelector(".recipe-grid", { timeout: 20000 });
await desktop.waitForTimeout(2000);
await desktop.screenshot({ path: join(OUT_DIR, "overzicht.png"), fullPage: true });
console.log("✓ overzicht.png");

// --- Overzicht (mobiel) ---
const mobile = await newPage(390, 844);
await mobile.goto(BASE_URL, { waitUntil: "load", timeout: 45000 });
await mobile.waitForSelector(".recipe-grid", { timeout: 20000 });
await mobile.waitForTimeout(2000);
await mobile.screenshot({ path: join(OUT_DIR, "overzicht-mobiel.png"), fullPage: true });
console.log("✓ overzicht-mobiel.png");
await mobile.close();

// --- Per gerecht een detail-screenshot (optioneel) ---
if (WITH_DETAILS) {
  const labels = await desktop.$$eval(".recipe-photo", (els) =>
    els.map((el) => el.getAttribute("aria-label")),
  );
  for (const label of labels) {
    const name = (label || "").replace(/^Bekijk\s+/i, "");
    await desktop.click(`.recipe-photo[aria-label="${label}"]`);
    // Wacht tot de detailweergave (modal/overlay) er staat.
    await desktop.waitForTimeout(700);
    await desktop.screenshot({ path: join(OUT_DIR, `detail-${slug(name)}.png`) });
    console.log(`✓ detail-${slug(name)}.png`);
    await desktop.keyboard.press("Escape");
    await desktop.waitForTimeout(300);
  }
}

await browser.close();
console.log(`\nKlaar. Screenshots staan in ./${OUT_DIR}/`);

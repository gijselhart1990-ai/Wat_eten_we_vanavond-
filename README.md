# Wat eten we vanavond?

Een Nederlandstalige foodplanner met 17 opgeslagen recepten, weekplanning en een automatische, gegroepeerde boodschappenlijst.

## Lokaal starten

```powershell
pnpm install
pnpm dev
```

Open daarna [http://localhost:3000](http://localhost:3000).

## Supabase-opslag

Maak een Supabase-project, schakel **Anonymous Sign-Ins** in, voer [supabase/schema.sql](supabase/schema.sql) uit en kopieer `.env.example` naar `.env.local`. Vul daarna de URL en anon key in. De app maakt per apparaat een anonieme Supabase-sessie aan en bewaart daar de weekplanning, porties, favorieten, eigen boodschappenitems en afvinkstatus met een korte debounce.

Zonder omgevingsvariabelen werkt de volledige interface lokaal; alleen de permanente cloudopslag is dan niet actief.

## Productie

De app is een Next.js 14 App Router-project en kan direct worden geïmporteerd in Vercel of Netlify. Gebruik `pnpm build` als build-opdracht.

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

## Picnic-koppeling

De boodschappenpagina bevat een optionele persoonlijke koppeling met Picnic. Na het verbinden kan de app voor iedere niet-afgevinkte boodschap maximaal drie Picnic-producten zoeken, een passend aantal voorstellen en na een extra bevestiging de geselecteerde producten aan het Picnic-mandje toevoegen.

De koppeling plaatst geen bestelling en voert geen betaling uit. Controleer het mandje en rond de bestelling altijd zelf af in de officiële Picnic-app.

Voeg voor deze functie lokaal en in Netlify de volgende geheime omgevingsvariabele toe:

```text
PICNIC_SESSION_SECRET=een-willekeurige-geheime-waarde-van-minimaal-32-tekens
```

Genereer bijvoorbeeld een waarde met:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Het Picnic-wachtwoord wordt niet opgeslagen. Na het inloggen bewaart de server alleen de Picnic-sessiesleutel, versleuteld in een `HttpOnly` cookie. Eventuele sms-verificatie verloopt via een tijdelijke cookie van maximaal tien minuten.

> Let op: deze integratie gebruikt een onofficiële Picnic-interface en kan stoppen wanneer Picnic zijn interne API wijzigt. Gebruik haar alleen voor je eigen account en beperk het aantal synchronisaties.

## Productie

De app is een Next.js 14 App Router-project en kan direct worden geïmporteerd in Vercel of Netlify. Gebruik `pnpm build` als build-opdracht.

# Focusboard

Een lichte, statische Nederlandse dagplanner met taken, filters en een focustimer. Taken en focusminuten worden alleen in de `localStorage` van de browser bewaard; er is geen account, tracker of externe afhankelijkheid.

## Lokaal starten

Deze app heeft geen installatie- of buildstap nodig. Start bijvoorbeeld een eenvoudige webserver vanuit de projectmap:

```powershell
python -m http.server 4173
```

Open daarna `http://localhost:4173`.

## Publiceren op Netlify

1. Push deze map naar een GitHub-repository.
2. Importeer de repository in Netlify.
3. Gebruik `.` als publish directory; er is geen build command nodig.
4. Pas voor de eerste publicatie de drie voorkomens van `focusboard.netlify.app` aan in `index.html`, `robots.txt` en `sitemap.xml` naar de definitieve domeinnaam.

`netlify.toml` stelt security headers en langdurige asset-cache in.

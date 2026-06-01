# ⚓ Port of Rotterdam · Mission Control

Een fancy **live dashboard** van de haven van Rotterdam met alle schepen op de
kaart. Klik op een schip voor uitgebreide details. Gebouwd als indrukwekkende
demo voor het Havenbedrijf Rotterdam.

![stack](https://img.shields.io/badge/React-18-38bdf8) ![stack](https://img.shields.io/badge/Vite-5-646cff) ![stack](https://img.shields.io/badge/MapLibre-4-22d3ee)

## Wat het laat zien

- 🗺️ **Donkere "mission control" kaart** van het havengebied (Maasvlakte → stad)
- 🚢 **~72 live bewegende schepen** als gekleurde pijlen die op koers varen
- 🖱️ **Klik op een schip** → side-panel met naam, vlag, type, snelheid, koers,
  bestemming, ETA, afmetingen, diepgang, tonnage, ligplaats en positie
- 📊 **Live statistieken**: aantal schepen, onderweg / voor anker / afgemeerd,
  gemiddelde snelheid en type-verdeling
- 🎚️ **Filter op scheepstype** door op de legenda te klikken
- ✦ **Sporen (trails)** achter varende schepen
- ◍ **Heatmap** van scheepsdichtheid (toggle)

## Starten

```bash
npm install
npm run dev      # open http://localhost:5173
npm run build    # productie-build in dist/
```

## Databron

De demo draait standaard op een **realistische simulatie** (`MockSource`) zodat
hij direct werkt zonder API-key. Schepen varen langs vereenvoudigde Rotterdamse
vaargeulen, liggen afgemeerd aan terminals of voor anker op zee.

### Omzetten naar echte live AIS-data

De data-laag is bewust verwisselbaar (`src/data/source.js`). Voor échte
real-time scheepsdata:

1. Vraag een gratis API-key aan op **[aisstream.io](https://aisstream.io)**.
2. Vervang in `src/App.jsx` de `MockSource` door `AisStreamSource`:
   ```js
   import { AisStreamSource } from './data/source.js'
   function createSource() {
     return new AisStreamSource({ apiKey: import.meta.env.VITE_AIS_KEY })
   }
   ```
3. Maak de `_handle()`-methode in `AisStreamSource` af: map elk AIS-bericht
   (`PositionReport` + `ShipStaticData`) naar het ship-formaat dat de UI
   verwacht (`mmsi, name, type, position [lon,lat], heading, speed, status, …`).

> ⚠️ Zet je AIS-key niet rechtstreeks in de browser-bundle in productie. Gebruik
> een kleine server-proxy (bv. een Node/Express WebSocket-relay) die de key
> server-side houdt.

Andere bronnen die interessant zijn voor het Havenbedrijf: **Portbase /
Pronto** (officiële aankomst- en vertrekdata), **Rijkswaterstaat** (waterstand
en getij) en **Open-Meteo** (weer) om het detailpaneel verder te verrijken.

## Projectstructuur

```
src/
├─ App.jsx                # state, layout, bron-keuze
├─ components/
│  ├─ MapView.jsx         # MapLibre-kaart, schepen, sporen, heatmap
│  ├─ Sidebar.jsx         # detailpaneel per schip
│  └─ StatsPanel.jsx      # live cijfers + typefilter
└─ data/
   ├─ geo.js              # geo-helpers (haversine, koers, route-positie)
   ├─ routes.js           # vaargeulen, ankergebied, ligplaatsen
   ├─ fleet.js            # scheepstypes + vlootgenerator
   └─ source.js           # MockSource (sim) + AisStreamSource (live stub)
```

## Tech

React 18 · Vite 5 · MapLibre GL JS 4 · CARTO dark basemap (OpenStreetMap-data).
Geen API-keys nodig om te draaien.

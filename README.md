# EV Charger Finder — South-East Melbourne

A single-page web app for finding EV chargers near your **home** and **work**, shown on an interactive map and a sortable/filterable list.

**Live site:** [davmos15.github.io/Jaecoo-EV-Chargers-Melbourne](https://davmos15.github.io/Jaecoo-EV-Chargers-Melbourne/)

The bundled charger list covers **south-east Melbourne** and every entry is compatible with the **Jaecoo J5** (Type 2 AC · CCS2 DC) — but the app works for anyone. You set your own home and work addresses and they're saved in your browser only.

No build step, no framework, no API keys. Just static files.

## Features

- **Interactive map** (Leaflet + OpenStreetMap) with colour-coded pins:
  - 🟢 Free · 🟠 Free allowance / pay-parking · 🔵 Paid
- **Set your own home & work** by typing an address (geocoded via OpenStreetMap Nominatim). Saved locally in your browser — nothing is stored on a server.
- **Real driving distances** on demand: press **Calculate driving distances** to fetch by-road distance + time from your home and work to every charger (via OSRM). Until then, a straight-line estimate is shown.
- **Filter** by cost (All / Free / Paid) and type (AC / DC fast), **search**, and **sort** by distance from home, distance from work, or name.
- **Tap a pin** → details pop up *on the map* (it doesn't jump you to the list). **Tap a list card** → the map flies to it.
- **Directions** (opens Google Maps driving directions) and **Details** (opens the charger's Google Maps page) on every entry.
- Each charger shows speed/connector, approximate cost, and whether you need to bring your own Type 2 cable.

## How to use

1. Type your **home address** (include suburb + state, e.g. `123 Example St, Caulfield South VIC`) and press **Set**. Do the same for **work**.
2. Press **Calculate driving distances** to replace the straight-line estimates with real by-road distance and drive time.
3. Filter / sort / search to taste. Tap pins or cards for details and directions.

## Updating the charger list

All charger data lives in **`chargers.js`** as a plain array — open it in any text editor and add/edit/remove entries, then re-deploy. Each entry:

```js
{ n:"Name", net:"Network", a:"Street address",
  lat:-37.95, lng:145.08,
  t:"free" | "partial" | "paid",
  kw:"DC · up to 150 kW",
  cost:"~$0.60/kWh",
  cable:"Attached (CCS2)" | "Bring your Type 2 cable",
  note:"Tips / caveats",
  v:true }  // optional: marks an unverified entry (dashed border)
```

Get accurate `lat`/`lng` by right-clicking a spot in Google Maps and copying the coordinates.

## Privacy

Your home and work addresses are stored using your browser's `localStorage` on your device only. The app makes outbound requests in three cases: map tiles (OpenStreetMap), address lookup (Nominatim) when you press **Set**, and the routing matrix (OSRM) when you press **Calculate driving distances**. No analytics, no accounts, no tracking.

## A note on accuracy

Prices and charging speeds change often and vary by site and time of day — the figures here are **approximate**, last reviewed **June 2026**. Always confirm the live price and availability in the network's own app before relying on a charger. Entries marked unverified (dashed border) may have restricted access or may not exist as listed.

## Built with

- [Leaflet](https://leafletjs.com/) — map rendering
- [OpenStreetMap](https://www.openstreetmap.org/) — map tiles & data
- [Nominatim](https://nominatim.org/) — geocoding
- [OSRM](http://project-osrm.org/) — driving-distance routing

These are free public services with fair-use limits; please don't hammer them. For heavy or commercial use, swap in a keyed provider (e.g. OpenRouteService, Mapbox).

## Support

If this saves you some charging frustration, you can [buy me a coffee ☕](https://buymeacoffee.com/nadavmoskow) — much appreciated!

## License

MIT — see [LICENSE](LICENSE).

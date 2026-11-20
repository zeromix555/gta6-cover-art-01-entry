# Vice Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zeromix555/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zeromix555/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline, in-browser cover maker for the **gta6-cover-art-01** bounty: turn your own photos into a multi-panel Vice City poster and export it as a PNG to share.

## What it does

- **Four layouts** — Hero + 3, 2×2 grid, full bleed, and a tilted snapshot strip.
- **Per-panel photos** — upload your own photo into any panel, or use the two bundled samples. Drag the photo on the canvas to reposition it; zoom per panel.
- **Five Vice City grades** — Sunset, Neon nights, Vice teal, Golden hour, Mono noir.
- **Caption editing** — a bold Anton title with a Pacifico neon subtitle, sized to fit.
- **One-step export** — PNG in 1080×1080, 1080×1350, or 1920×1080.

Everything runs offline in the browser: no network requests, no uploads, your photos never leave your machine. The lettering uses Anton and Pacifico, vendored under `app/fonts/` under the SIL Open Font License. All art and lettering is original — no Rockstar Games logo, artwork, or fonts.

## Try it

```sh
node serve.ts   # serves app/ on http://localhost:8080
```

Open the page, pick a layout and a grade, drop your photos into the panels, type a title, and hit **Export PNG**.

## How it is built

- `app/` — the static web app (`index.html`, `style.css`, `src/cover.js` render engine, `src/main.js` wiring, `samples/`, `fonts/`).
- `main.ts` — the entrypoint (Node 22, standard library only): validates the entry against the scorer's caps, copies `app/` and `screenshots/` to `/output`, and writes `/output/dossier.json` with the vendored make.fun library.
- `screenshots/` — 3–4 screenshots: the app in the browser with a photo loaded, and covers the app itself exported.

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=jwef5djp&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

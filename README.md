# Vice Coast Cover Studio

[![make.fun](https://make.fun/badge.svg)](https://make.fun)
[![gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01/badge.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![built with make.fun](https://make.fun/built-with.svg)](https://make.fun?ref=jwef5djp)

Turn your own photos into a multi-panel Vice City poster cover, right in
your browser, with nothing uploaded anywhere.

## What it does

- **Four poster layouts** — Hero Trio (one big moment, three small ones),
  Four Square, Full Frame, and a tilted Snapshot Strip.
- **Five sunset grades** — Sunset Drive, Neon Nights, Vice Teal, Golden
  Hour, and Noir Mono. The grade tints every photo the same way, so the
  panels feel shot in one light.
- **Your photos, your crop** — upload a photo per panel or try the two
  model-made samples. Drag a photo to reposition it, scroll to zoom, or
  use the zoom slider. Click any panel to select it.
- **Your caption** — a bold Anton headline with a Pacifico tagline that
  glows in the grade's colour, plus a small "VC / VICE COAST" corner bug.
- **Real PNG export** — 1080×1080, 1080×1350, or 1920×1080, rendered
  fresh at full size from the same painter the preview uses, so what you
  see is what you download.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Everything is static files under `app/` and works with no network
request: scripts, fonts, and sample photos are all local. Photos you
upload are read on your own machine and never leave it.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) checks the entry against the
competition's caps, copies `app/` and `screenshots/` to the output
directory, and writes `dossier.json` with the vendored make.fun library.
Run it twice: both runs write the same bytes.

## Credits

- Lettering: Anton and Pacifico, vendored under `app/fonts/` under the
  SIL Open Font License (see `app/fonts/OFL.txt`).
- Sample photos (`app/samples/boulevard.jpg`, `app/samples/pier.jpg`):
  made with an image model for make.fun, free to use.
- Original work, not affiliated with Rockstar Games. No Rockstar logo,
  artwork, or font is used anywhere in this entry.

## License

MIT — see [LICENSE](LICENSE).

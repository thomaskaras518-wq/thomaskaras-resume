# Field Survey — Thomas Karas

A resume that reads as the thing it describes: Thomas Karas' career drawn as an
isometric data-warehouse architecture on aged field-journal paper. The landing
page is an explorable survey map; every block opens a rubber-stamp field note
about that station.

**Static HTML, CSS and JavaScript. No build step, no dependencies, no framework.**
Push it and GitHub Pages serves it.

## Layout

```
index.html                        the survey map (explorer chrome + isometric diagram)
origins.html                      Source — CU, Designing for Defense, Zayo internship
stack.html                        the instrument bus: every system, and what it is for
roles/zayo-analyst.html           Staging   — Business Analyst
roles/zayo-product.html           Transform — Technical PM / Scrum Product Owner
roles/upstack-ma-integration.html Transform — M&A Integration Analyst
roles/lightpath.html              Mart      — Sr. Project Manager
roles/upstack-data-platform.html  Semantic  — Manager, Data Platform & Operations

assets/css/journal.css            the whole design system, token-driven
assets/js/survey.js               pan, zoom, keyboard nav, panel — enhancement only
assets/img/                       photographs and posters (see below)
assets/ThomasKaras-Resume-2026.pdf

tools/build-diagram.mjs           regenerates the isometric SVG into index.html
tools/build-pages.mjs             regenerates every field-note page
tools/stamps.mjs                  the carved rubber-stamp emblems
```

The `tools/` scripts are **not needed to serve the site** — their output is
committed. They exist so content changes stay consistent across eight pages.

## Adding your photographs

Drop files into `assets/img/` and re-run the page generator. For each station it
looks for, in order:

| File | Effect |
|---|---|
| `poster-<slug>.jpg` | A finished 4:3 stamp poster — used as the whole hero |
| `plate-<slug>.jpg`  | A plain photograph — fills the left 58% of the poster |
| *neither*           | A drawn "plate pending" frame |

Slugs are `origins`, `zayo-analyst`, `zayo-product`, `upstack-ma-integration`,
`lightpath`, `upstack-data-platform`, `stack`.

```sh
node tools/build-pages.mjs
```

Also worth adding: `assets/img/og-cover.png`, the link-preview image (1200×630).

## Changing content

- **Career copy, results, tool lists** — edit the `PAGES` array in
  `tools/build-pages.mjs`, then `node tools/build-pages.mjs`.
- **The diagram** — edit `STAGES`, `EDGES` and `TOOLS` in
  `tools/build-diagram.mjs`, then `node tools/build-diagram.mjs`. Block height
  encodes scope; `plates: {n, t, gap}` draws a stack of `n` slabs, and `n` should
  always be a real count.
- **The right-hand panel copy** — the JSON in `<script id="station-data">` at the
  bottom of `index.html`.
- **Colours and type** — the token block at the top of `assets/css/journal.css`.

## Deploying to GitHub Pages

Settings → Pages → **Deploy from a branch** → pick the branch → folder `/ (root)`.
The site lands at `https://<user>.github.io/thomaskaras-resume/`. Every internal
link is relative, so it also works from a bare custom domain with no changes.

## Notes

- The phone number and the named references from the PDF are deliberately not on
  the site — it is public and gets scraped. They stay in the PDF.
- Fonts load from Google Fonts, with real fallback stacks if that request fails.
- The page is fully navigable with JavaScript disabled; `survey.js` only adds
  pan, zoom, keyboard traversal and the live panel.
- Dark mode renders the paper under low light rather than inverting it.

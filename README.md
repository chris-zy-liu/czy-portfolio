# czy-portfolio

Personal portfolio for **Chris Zhengyu Liu** — Industrial & Systems Engineering at
Georgia Tech. A single static page with a light-blueprint / engineering-notebook
aesthetic, built from scratch with vanilla HTML, CSS, and JavaScript (no framework,
no build step).

## Highlights

- **Live `desmos.py` Mandelbrot** (Fig. 1) — the hero figure is the real
  [desmos.py](https://github.com/chris-zy-liu/desmos.py) compiler running through the
  Desmos GraphingCalculator API, with the chrome stripped and recolored to match the page.
- **Markov-chain site map** — the sections are modeled as a Markov chain. An agent does a
  random walk over the transition matrix `P`; nodes are sized by the stationary
  distribution `π`. The §00 diagram, the docked minimap, and the per-section state tags
  all read from the same matrix (`js/markov.js`).
- **Bespoke SVG figures** for each project, plus scroll-reveal animations.

## Run locally

No build step. Serve the folder over HTTP (the Desmos embed needs `http(s)://`, not `file://`):

```bash
python -m http.server 8123
# then open http://127.0.0.1:8123/
```

## Project structure

```
index.html        # the page
404.html          # styled not-found page
favicon.svg
css/styles.css    # all styles + design tokens
js/mandelbrot.js  # builds/drives the hero desmos.py embed
js/markov.js      # the Markov chain: diagram, minimap, state tags
js/main.js        # scroll-reveal + hero figure HUD wiring
src/              # image assets
lab/              # scratch experiments (not linked from the site)
```

## Deploy (GitHub Pages)

This deploys as a **project page** (the `chris-zy-liu.github.io` user page is the poetry site),
served from the custom domain **czliu.dev**:

1. Commit and push to `origin`.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pick the default branch and `/ (root)`, then **Save**.
3. The `CNAME` file (`czliu.dev`) sets the custom domain; point DNS at GitHub Pages
   (apex A records `185.199.108–111.153`, or a `www` CNAME to `chris-zy-liu.github.io`),
   then enable **Enforce HTTPS**.
4. Live at **https://czliu.dev/** (the old `chris-zy-liu.github.io/czy-portfolio/` redirects there).

`.nojekyll` is included so Pages serves files as-is.

### Social preview image
`og-image.png` (1440×630-ish) is referenced from `<head>` as `https://czliu.dev/og-image.png`
for rich link previews on LinkedIn/Twitter. (SVG isn't supported as an OG image by most platforms.)

## Notes

- The Desmos API key in `index.html` is a public, domain-embeddable key — safe to commit.
- Content is kept to claims that are defensible; see the résumé content bank for the
  source of truth.

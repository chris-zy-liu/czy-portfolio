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
  distribution `π`. The chain, navigation, and section content live in `index.html`.
- **Persistent section links** — navigate by zooming out through the chain and into the
  selected node. Links support section URLs and browser Back/Forward. Map returns to
  the overview; drag to pan, and open nodes by click, tap, or keyboard. On phones,
  a section menu replaces the desktop ribbon while Home and Map remain available.
  Long sections scroll inside their node. Reduced-motion preferences skip the flight animation.
- **Bespoke SVG figures** for each project, plus scroll-reveal animations.

## Run locally

No build step. Serve the folder over HTTP (the Desmos embed needs `http(s)://`, not `file://`):

```bash
python -m http.server 8123
# then open http://127.0.0.1:8123/
```

## Project structure

```
index.html        # chain view, content, styles, and navigation
linear.html       # redirects old links to the chain, preserving section hashes
404.html          # styled not-found page
favicon.svg
css/styles.css    # retained styles from the former linear view
js/mandelbrot.js  # builds/drives the hero desmos.py embed
js/markov.js      # retained former linear-view map
js/main.js        # retained former linear-view interactions
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

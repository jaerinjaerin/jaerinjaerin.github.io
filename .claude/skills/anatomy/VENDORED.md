# Vendored copy of the Anatomy skill

- Source: https://github.com/wheresryan22/anatomy (MIT, see LICENSE)
- Commit: 1482e84 (2026-10-18)
- Removed to keep the repository small: example PDFs and the built example pages (`examples/*/*.html`).
  Rebuild any example with `node examples/<name>/build.mjs` (add `--light` for the light theme).
- The site uses its own copy of the kit in `src/figures/kit/` so the site build does not depend on this folder.

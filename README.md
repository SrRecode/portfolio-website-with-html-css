# Portfolio Website (HTML & CSS)

A responsive, accessible personal portfolio built with **plain HTML, CSS and
JavaScript** — no framework, no build step, no dependencies. Includes a tiny
dependency-free Node preview server and a `node:test` suite that checks the
markup, styles and helper logic.

## Features

- **Semantic, accessible markup** — landmarks (`header`/`main`/`section`),
  a skip link, `aria-*` wiring on the nav toggle and theme button, visible
  focus styles.
- **Light & dark themes** driven by CSS custom properties. Preference comes
  from `localStorage`, falling back to `prefers-color-scheme`.
- **Responsive layout** — fluid type via `clamp()`, an auto-fitting project
  grid, and a collapsible mobile nav.
- **Scroll polish** — a top progress bar and active-section highlighting via
  `IntersectionObserver`.
- **`prefers-reduced-motion` respected** — smooth scrolling and transitions are
  disabled for users who ask for it.

## Getting started

```bash
npm start     # serves the site at http://localhost:4173 (override with PORT)
npm run dev   # same, with --watch
npm test      # node:test suite (helpers + markup/assets)
```

No install required — the preview server uses only Node's built-in modules.

## Project layout

```
index.html         The page: hero, about, projects, contact
styles.css         Design tokens, light/dark themes, responsive layout
theme.js           Pure helpers: resolveTheme / nextTheme / activeSection
script.js          Browser wiring: theme toggle, mobile nav, scroll progress
scripts/serve.js   Dependency-free static preview server (contentType, safeJoin)
test/site.test.js  node:test coverage
```

## Design notes

- `theme.js` holds **pure** functions with no DOM access, so the theme and
  active-section logic is unit tested directly. `script.js` only wires them to
  the DOM.
- `scripts/serve.js` exports `contentType()` and `safeJoin()` — the latter
  resolves a request path inside the site root and **refuses path traversal**
  (`/../..`) by checking the resolved path stays under the root.
- Colors are defined once as custom properties and re-mapped under
  `:root[data-theme='dark']`, so switching themes never touches layout.

## Customizing

1. Replace the copy in `index.html` (name, projects, contact email).
2. Edit the palette in the `:root` blocks at the top of `styles.css`.
3. To deploy, the site is fully static — publish the three root files
   (`index.html`, `styles.css`, `script.js`, `theme.js`) to any static host.

## Tests

```bash
npm test
```

Covers theme resolution/flipping, active-section math, MIME mapping, path
traversal rejection, a live static-server round-trip, and a markup smoke test
that asserts landmarks/ids exist and every locally referenced asset is present.

## License

MIT

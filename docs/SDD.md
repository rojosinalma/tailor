# tailor — software design document

Status: 0.1.0 — core + 8 skins (bootstrap, pico, simple, webtui, daisyui, luz, tufte, govuk;
all 43/43 tier-1) × 21 palettes, React adapter (`react/`, CSS path + Primer kit), `tailor` CLI,
static showcase. Contract changes are recorded in `CHANGELOG.md` and §3 of this document.

## 1. Purpose

A typical small web app ships a retinted framework stylesheet plus hand-adapted components, which
binds every UI to one framework and one palette. tailor separates three things that are usually
fused: **what a component is** (vocabulary), **how it looks in a given design system** (skin),
**which colours it wears** (palette). Projects write vocabulary; skins and palettes are swappable
files; tooling and code generators read one `manifest.json`.

## 2. Architecture

```
palettes/src/<id>.json  ──gen-palette──▶  palettes/<id>.css   ([data-palette="<id>"] { --t-* })
(canonical, schema-checked)                      │
core/tokens.css  (--t-* names, Dracula :root)    │
core/base.css    (functional baseline)           │   cascade: tokens → base → layout → skin → palette → app
core/layout.css  (shell/page/grid geometry)      │
skins/<id>/skin.css (look of t-* classes) ───────┘
core/tailor.js   (behaviour: toggles aria/data attributes only)
core/components.json (vocabulary) ──build──▶ showcase/index.html, manifest.json
```

### 2.1 Core (`core/`)

- `tokens.css` — the only names anyone may colour with. Three groups: palette tokens (1:1 with the
  palette schema fields: `canvas inset surface selection border text muted disabled accent
  accent_solid on_accent link success warning danger info extra.*` → `--t-canvas … --t-hue-*`, plus
  `--t-overlay-bg` from the darkest neutral), derived tokens (`--t-focus-ring`, `--t-backdrop`, tint
  percentages — never set by palettes) and scale tokens (space, radius, type, shadow, control heights,
  layout metrics — skins may override). `:root` holds Dracula; `:root[data-mode="light"]` Alucard.
  The tone resolver `[data-tone="x"] { --t-tone: var(--t-x) }` lives here so every component reads
  one variable.
- `base.css` — reset + typography + the rules that make components *function* without a skin
  (hidden panels, dialog box, toast stack, tooltip box, segmented radios, truncation) plus a plain
  tokens-only look. Default tones are declared with `:where()` (zero specificity) so `[data-tone]`
  always wins by specificity, not by source order.
- `layout.css` — the app shell as a CSS grid (`nav / side main / foot`), page header, section,
  toolbar, grid, stack/cluster, split, settings and facts grids. Metrics are tokens
  (`--t-nav-h` 56px, `--t-footer-h` 32px, `--t-sidebar-w` 220px, `--t-gutter` clamp(1rem,3vw,3rem)).
- `tailor.js` — `window.Tailor`: `theme` (skin × palette × mode switcher), `toast`, `tabs`,
  `listbox`, `menus`, `dialogs`, `confirm`, `times`/`relativeTime`, `tooltips`, `help`, `copy`,
  `truncate`, `dismiss`, `filters`, `settingsAutoSave` + `duration`, `sortable`, `scrollspy`,
  `upgrade(root)`. Idempotent wiring (`data-t*` marks), `t:*` bubbling events, no colour, no skin
  knowledge.
- `components.json` — the vocabulary (schema `components.schema.json`). Per component: `id`, `tier`,
  `group`, `root` class, `parts`, `attributes` (allowed `data-*`/aria values), `states`, `behaviour`
  (`none` | `js:Tailor.<fn>`), `a11y`, canonical `markup`, showcase `demo`, `notes`, `source`.
  Tier 1 = must-cover (43); tier 2 = optional extras (8 seeds).
- `conventions.md` — the human contract: naming (`t-<component>`, `t-<component>-<part>`,
  `data-variant|tone|size`, aria states), semantic-HTML-first, what skins may/may not do.

### 2.2 Skins (`skins/<id>/`)

One `skin.css` + `manifest.json` (schema `skins/manifest.schema.json`): `id name system version
coverage tier2 palette_constraints{mode, needs?, exclude?} vendor{package version license url
vendored} files{css assets? build?} tokens_overridden? notes`. Rules in `SKIN-CONTRACT.md`: style
every tier-1 component's root/parts/attributes/states; markup read-only; no JS; colours only
`var(--t-*)`/`color-mix()`; never set palette tokens; `:where()` for default tones.

### 2.3 Palettes (`palettes/`)

Canonical sources live in the repo: `palettes/src/<id>.json`, validated against
`palettes/src/palette.schema.json` (`$TAILOR_PALETTES` overrides the source directory, e.g. to
build from your own palette set). `bin/gen-palette` maps fields → tokens mechanically
(`bin/lib/common.js → tokenPairs/paletteCss`): a `[data-palette="<id>"]` block with `color-scheme`,
and a `[data-palette="<id>"][data-mode="light"]` block when the palette has `light`. A palette's
**modes** = `[mode]` or `[mode, other]`. Generated CSS is committed so consumers need no tooling;
each header cites the upstream source and licence (`license` field: SPDX id or `values-only (<reason>)`
— see `docs/palette-licenses.md`). 21 palettes at 0.1.0.

A palette may carry an optional `primer` section (hand-tuned colour map, token overrides, hue bands).
`bin/gen-primer-theme` (`tailor gen --target primer <id>`, `bin/lib/primer.js`) then derives a **Primer
Primitives theme** from it: the stock `dark.css` of the `@primer/primitives` pinned in `react/package.json`
is rewritten token by token (override → exact map → nearest palette hue with OKLCH lightness preserved,
`var()`/`color-mix()` untouched) into `react/adapters/primer/themes/<mode>_<id>.css`, plus a generated
`themes/index.ts` that imports them all and exports the theme list for `ThemeProvider`. Primer is the kit
behind the React adapter, so these files are a tailor artefact like `palettes/<id>.css`: `bin/build`
regenerates them (skipped with a note when `react/` has no `node_modules`), `bin/verify` fails on a stale
or stray file, `manifest.json` lists each palette's `primer_theme`. Other frameworks' themes are not
tailor's: `tailor gen <system> <palette>` without `--target` stays a passthrough to an external generator.

### 2.4 Switcher

`<html data-skin data-palette data-mode>` + `<link id="t-skin" data-base>` + `<link id="t-palette"
data-base>`. Pre-paint IIFE (template in `core/tailor.js` header, live copy in
`bin/lib/showcase.js`) resolves `?skin= ?palette= ?mode=` → `localStorage["<project>.skin|palette|
mode"]` → defaults, whitelists against the bundled lists, resolves `auto` via
`prefers-color-scheme`, clamps the mode to what the palette offers, and `document.write`s the two
links **after the core links** (same specificity as `tokens.css :root`, so order decides). Runtime:
`Tailor.theme.init(config)` renders `[data-tailor-pickers]` into a sun/moon mode toggle
(`[data-tailor-mode-toggle]`, icons `bi:sun`/`bi:moon-stars` from `config.icons` = `config.base + "icons.svg"`,
disabled when the palette offers one mode) plus skin/palette selects (options sorted by name from
`config.labels`, only when there is a choice; `data-tailor-pickers="mode"` / `"skin palette"` renders a subset),
fills empty `[data-tailor-picker="skin|palette|mode"]` selects the same way, wires them, persists, emits
`t:theme`. There is no "Auto" choice in the UI: `auto` is only a default (first visit follows
`prefers-color-scheme` until the user toggles). Query params win for the first paint only.
Placement convention: toggle first in `.t-footer-end`; selects on the settings page when there is one,
else next to the toggle (conventions §8). `.t-shell` is single-column unless a `.t-shell-side` child exists
(`:has()`).

### 2.5 Build & manifest (`bin/build`)

Regenerates `palettes/*.css` (all source palettes; `--no-palettes` offline), computes
**compatibility** (skin × palette → list of modes: a palette fits a skin when it offers a mode the
skin accepts (`both|dark|light`), satisfies `needs`, and is not in `exclude`), writes
`manifest.json` (`contract`, `core.load_order`, `vocabulary{tier1,tier2,components}`, `skins`,
`palettes{id,name,mode,modes,license,file}`, `icon_sets{id,prefix,name,version,license,count,samples}`,
`compatibility`), `showcase/index.html` and `showcase/icons.svg` (a sample sprite of every adopted set).
Icon data comes from the `@iconify-json/*` packages pinned in `icons/package.json`, adopted by one line in
`icons/sets.json`; without them installed the committed `icon_sets` and sprite are kept with a note.

### 2.6 Verify (`bin/verify`)

| Area | Checks | Fails when |
|---|---|---|
| core | components.json vs schema; unique ids; known groups; every class in markup/demo is a declared `t-*` root/part or base utility; tones exist; every `js:Tailor.x` is defined; CSS parses (brace check, lightningcss when installed); tailor.js parses | any violation |
| palettes | tokens.css `:root` + every `[data-palette]` block defines the full 24-token set; contrast text/canvas ≥ 4.5, muted/canvas ≥ 4.5, text/surface ≥ 4.5, on-accent/accent-solid ≥ 3 | missing token or contrast below floor |
| icons | `icons/sets.json` valid and every set pinned; with the packages installed: licence equals the data's SPDX id, `manifest.json → icon_sets` and `showcase/icons.svg` recomputed and identical | mismatch or stale (FAIL); packages missing → WARN |
| skins | manifest vs schema; `coverage ⊇ tier-1` (lists gaps); ids known; skin.css parses; no palette token *set*; no colour literal; listed assets and `@import`s exist; modifier-like selectors → WARN | any FAIL; skipped with a note when `skins/` has no skin |
| showcase | renders; a section per tier-1 id; unique ids; committed `index.html`/`manifest.json` not stale (WARN) | render error, missing section, duplicate id |

Exit 0 with zero skins (core-only mode), so the core can be verified before any skin exists.

### 2.7 Showcase (`showcase/`)

Generated static page (`bin/lib/showcase.js`): app shell, sidebar of groups → components (scrollspy),
one `<section class="t-card sc-component" id="<component id>">` per tier-1 component with
description, live `demo`, collapsible canonical markup. Pickers for skin/palette/mode; `?only=<id>`
isolates one section; `?open=dialog|confirm`. Chrome classes are `sc-*`; demos use vocabulary
classes only, so a skin is judged on the real vocabulary. All links are relative (`../core`,
`../skins`, `../palettes`), so any static server at the repo root serves it at `/showcase/`.

## 3. Contracts (stable; change = issue + CHANGELOG + verify update)

1. Class prefix `t-`, token prefix `--t-`, attribute vocabulary (`data-variant data-tone data-size`
   + per-component enums), aria state table — `core/conventions.md`.
2. `core/components.json` shape and the tier-1 id list — adding is minor, renaming/removing is major.
3. `skins/manifest.schema.json`.
4. `manifest.json` shape (§2.5).
5. Load order and the switcher protocol (§2.4).
6. Vendored-file header `/* managed by tailor v<version> — … — do not edit, run `tailor sync` */`;
   `tailor apply --skin <id[,id…]|all>` vendors multiple skins (first = default) and the head-snippet
   config lists them, which is what makes a consumer's runtime skin switcher work.
7. Icon delivery: `tailor apply --icons <set:name,…>` → `public/tailor/icons.svg`, one
   `<symbol id="<set>-<name>">` per icon, used as `<svg class="t-icon"><use href="/tailor/icons.svg#<set>-<name>"/></svg>`
   (`core/conventions.md §2`, `docs/icons.md`).

## 4. Scope

tailor ships as plain files: no runtime framework, no npm package, one canonical copy of each
palette, one shared core (no per-project forks), skins that never change markup, and consumers
that colour only through `--t-*` tokens.

## 5. Delivered (0.1.0)

- Skins: bootstrap, pico, simple, webtui, daisyui,
  luz, tufte, govuk — each 43/43 tier-1, translate-not-vendor, `--t-*` only, verified by
  `bin/verify` + showcase screenshots.
- `react/`: `Ui.*` components with markup parity (`react/bin/check-parity`, 43/43), Primer kit
  adapter (29 mapped, rest fall back to the CSS path).
- `bin/tailor` CLI: `apply|sync|list|gen`, multi-skin vendoring, consumer registry, managed headers.
- Primer themes per palette (`tailor gen --target primer`, `react/adapters/primer/themes/`), 21 generated.

## 6. Open

- CI: `.github/workflows/run-tests.yml` runs `bin/build` + `bin/verify` and the React typecheck on
  every push and pull request.
- More kit adapters in `react/` (only Primer so far); more skins, palettes and icon sets per
  `CONTRIBUTING.md`.

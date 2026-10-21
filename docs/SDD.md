# tailor — software design document

Status: 0.1.0 — core + 9 skins (bootstrap, pico, simple, webtui, daisyui, luz, tufte, govuk, primer;
all 43/43 tier-1) × 21 palettes, React adapter (`react/`, tailor markup + theme switcher), `tailor` CLI,
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

Other frameworks' themes are not tailor's: `tailor gen <system> <palette>` is a passthrough to an external
generator. The built-in Primer Primitives theme generator (`tailor gen --target primer`) was removed in 0.11.0;
the `primer` skin gives the Primer look in tailor markup.

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
Placement convention: the pickers element first in `.t-footer-end`, rendering [kit,] skin, palette, then the mode
toggle last (`xs` controls inside a footer); selects on the settings page when there is one,
else in the footer element (conventions §8). `.t-shell` is single-column unless a `.t-shell-side` child exists
(`:has()`).
React pages (`tailor apply --react`: no `tailor.js`; the head snippet keeps the pre-paint IIFE and
`window.TAILOR_CONFIG` but drops the `tailor.js` script and the `init` call) use the React twin in
`react/src/theme.tsx`: `useTailorTheme(config = window.TAILOR_CONFIG)` with the same resolution, whitelists,
`auto` handling, mode clamp, `<html>` attributes, link re-pointing, localStorage keys and `t:theme` event, one
state per page (module store + `useSyncExternalStore`, SSR-safe). `<Ui.Pickers parts size>` renders the same
markup as `renderPickers` + `paintPickers`, selects drawn like `Tailor.selects`. When `window.Tailor.theme`
exists on the page, the hook delegates `set()` to it and follows its `t:theme`, so mixed pages keep one state.

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
description, live `demo`, collapsible canonical markup. Pickers for skin/palette/kit/mode; `?only=<id>`
isolates one section; `?open=dialog|confirm`. **Kit picker** (`?kit=tailor|react`, `Tailor.theme` `kits`,
first in the footer): `tailor` = "HTML" (the demos wired by `tailor.js`), `react` = "React". `react` lazy-loads
`showcase/kit/kit.js` — a Vite bundle `bin/build` makes from `react/demo/src/kit.tsx`
(`react/demo/vite.kit.config.ts`; kept as committed when `react/node_modules` is missing; no CSS of its own) —
which mounts one React root and portals an island into every `.sc-demo[data-component-id]` that has one
(`react/demo/src/islands.tsx`: each tier-1 `demo` of `core/components.json` rebuilt through `Ui.*` only, with the
same variants, texts and `data-demo` interactions; after mount the DOM equals the upgraded HTML; tier-2 demos
stay HTML). Same markup, so the skin and palette stay on and every skin is selectable. The footer pickers
become `Ui.Pickers`: the HTML skin/palette/mode controls are hidden and the React ones portalled after the Kit
select, which stays HTML (kit, skin, palette, mode order). The bundle's theme store delegates to
`Tailor.theme`, so both pickers stay in one state. Switching back unmounts and moves the original demo and
picker nodes back (not re-parsed), so their `tailor.js` listeners survive. Chrome classes are `sc-*`; demos use vocabulary
classes only, so a skin is judged on the real vocabulary. All links are relative (`../core`,
`../skins`, `../palettes`), so any static server at the repo root serves it at `/showcase/`.

## 3. Contracts (stable; change = issue + CHANGELOG + verify update)

1. Class prefix `t-`, token prefix `--t-`, attribute vocabulary (`data-variant data-tone data-size`
   + per-component enums), aria state table — `core/conventions.md`.
2. `core/components.json` shape and the tier-1 id list — adding is minor, renaming/removing is major.
3. `skins/manifest.schema.json`.
4. `manifest.json` shape (§2.5).
5. Load order and the switcher protocol (§2.4).
6. Vendored-file header `/* managed by tailor v<version> — … — do not edit, run `tailor sync` */` (HTML/SVG/Markdown:
   `<!-- … -->`; the vendored `package.json`: its `"//"` field; `LICENSE`: the first line);
   `tailor apply --skin <id[,id…]|all>` vendors multiple skins (first = default) and the head-snippet
   config lists them, which is what makes a consumer's runtime skin switcher work.
7. Icon delivery: `tailor apply --icons <set:name,…>` → `public/tailor/icons.svg`, one
   `<symbol id="<set>-<name>">` per icon, used as `<svg class="t-icon"><use href="/tailor/icons.svg#<set>-<name>"/></svg>`
   (`core/conventions.md §2`, `docs/icons.md`).

## 4. Scope

tailor ships as plain files: no runtime framework, no npm package, one canonical copy of each
palette, one shared core (no per-project forks), skins that never change markup, and consumers
that colour only through `--t-*` tokens. The rule covers what `tailor apply`/`sync` vendor to consumers,
not the build tooling (Bun, Vite) or the showcase: the showcase's kit bundle is demo content, and the
React adapter is vendored only into React projects (`tailor apply --react` → `vendor/tailor-react/`).

### Design decisions

- **2026-10-20 — Viewport-bound shell, self-scrolling main/side.** What: `.t-shell` is `100dvh` + `overflow:
  hidden`; `.t-shell-main` and `.t-shell-side` scroll themselves (`position: relative` so absolute descendants
  never leak into the document), `scroll-padding-top` lands anchors below the header, `Tailor.scrollspy` reads
  the main scroller (last section passed the header; the last link when the scroller is at its end). Why: a
  document scrollbar ran beside the fixed header and footer and anchored titles hid under the header; the last
  sidebar item was never highlighted. Supersedes the sticky nav/foot/side from 0.1.0.
- **2026-10-20 — One floating panel at a time; panels escape clipping containers.** What: help popovers and
  `details.t-menu` register with `T.popup` like selects and pickers; a container (`.t-card`, `.t-list`,
  `.t-table-wrap`, `.t-dialog-body`) holding an open panel turns `overflow: visible` and lifts to
  `--t-z-overlay`; `.t-select-list` is `max-content` wide (min = trigger, max 24rem) and panels right-align at
  the viewport edge (`data-align="end"`). Why: two popups at once, chopped date pickers and truncated option
  labels. Supersedes the per-component outside-click handlers.
- **2026-10-20 — Footer pickers `xs`, order skin → palette → kit → mode; sidebar group titles larger than
  items; sprite icons everywhere tailor.js draws one.** What: `renderPickers` emits `data-size="xs"` inside
  `.t-footer`, the mode toggle is last; `.t-sidebar-group` is `--t-text-base` bold in core and every skin;
  toasts, confirm, number steppers and picker buttons render sprite symbols (`bi-*`, always vendored by
  `tailor apply`) with a text-glyph fallback when `Tailor.theme.icons` is unset; the showcase demos use sprite
  icons, never glyphs. `cursor: help` is gone from `.t-help-btn` (every other cursor stays). Why: pickers as tall
  as the footer, glyphs rendering as boxes, titles smaller than items. Supersedes the 2026-10-19 picker order
  (mode first).
- **2026-10-20 — Minimum gap between a bare `.t-toolbar`/`.t-cluster` and its next sibling.** What:
  `margin-bottom: --t-space-3` unless the parent is a layout primitive with its own gap. Why: a filter toolbar
  touched the table below it in a consumer. Supersedes nothing.
- **2026-10-20 — Kit picker, build-time kit bundle, light Primer themes.** What: the showcase gains a Kit
  picker (`tailor` | `primer`) backed by a Vite bundle built into `showcase/kit/` at `bin/build` time
  (§2.7); `bin/gen-primer-theme` writes `light_<id>.css` next to `dark_<id>.css` for every palette (§2.3).
  Why: the showcase shows everything tailor has, and the Primer kit rendering the very same demos is the
  honest way to show the React adapter; the bundle is demo content, so "no runtime framework" in what tailor
  ships stays intact; every tailor palette ships dark + light, so the Primer kit has to as well. The React
  adapter and Primer kit never reach consumers through `tailor apply`/`sync` — only React projects take them
  (as source from `react/`), chosen at scaffold time. Supersedes nothing.
- **2026-10-21 — `tailor move` and `tailor forget` manage the consumer registry.** What: `move <old> <new>`
  rewrites a recorded consumer's `path` and keeps every other field; `forget <dir>` removes a consumer and
  never touches the project's files; both match by exact resolved path, refuse with a reason, and honour `-n`.
  `sync` points at them when a consumer's directory is gone. Why: `apply`/`sync` match consumers by exact
  path, so a moved project re-applied at its new path got a second entry beside the stale one, and both a move
  and a retirement needed a hand edit of the git-ignored `consumers.json`. Supersedes hand edits of
  `consumers.json` for relocation and retirement.
- **2026-10-21 — Stack and split-pane children keep their content height.** What:
  `:where(.t-stack, .t-split-pane) > * { flex-shrink: 0; }` in `core/layout.css`; `.t-cluster` (a row, where
  shrinking lets text truncate), `.t-grid` (no flex) and `.t-dialog` (its body must shrink to scroll) stay as
  they are. Utilities keep class specificity: a component colour rule that a utility must beat gets a combined
  rule (`.t-stat-value.t-tone-text`), and consumers combine theirs the same way. Why: since the viewport-bound
  shell (0.8.0), a `.t-stack` in `.t-shell-main` squeezed `overflow: hidden` cards (automatic min-height 0) to
  fit a short screen, so every card clipped and main never scrolled (found in a consumer). `:where()` keeps the
  rule at zero specificity, so a consumer that wants a child to fill and scroll sets `flex` on it and wins; an
  audit of every consumer found none that relied on the old shrink. `!important` utilities were rejected: they
  would stop consumers from overriding them. Supersedes nothing.
- **2026-10-21 — `sync` warns when a public consumer repo keeps no leak-pattern list.** What: per consumer,
  `tailor sync` looks for `info/leak-patterns` in the repo's git common dir (one extended regex per line, never
  tracked, checked against every commit). When it is missing and the repo has an `origin`, sync asks
  `gh repo view --json visibility`; a public repo, or one whose visibility it cannot tell (no GitHub remote, no
  `gh`, no network), gets one `warning` line. Private repos and repos without a remote stay quiet. The warning
  never changes the exit code and also shows with `-n`. Why: a sync is followed by a commit of the vendored
  files, and a vendored file once carried a name that had no place in a public repo. The visibility call only
  runs for repos without the list, so a fully set-up `--all` makes no network call. Supersedes nothing.
- **2026-10-21 — Skins are design systems; React is an optional layer; Primer is a skin.** What: every
  project, React or not, switches every skin × palette × mode. A skin is one whole design system, never a
  sub-theme of another. HTML projects get no React code; React projects vendor the same CSS with
  `tailor apply --react` (no `tailor.js`, head snippet without it) and switch with `useTailorTheme` /
  `Ui.Pickers` from `tailor-react/theme` (§2.4). The Primer kit adapter (`tailor-react/primer`, `@primer/react`)
  is removed: tailor-react is the one React kit. `skins/primer` renders the Primer look in tailor markup, so
  Primer is one design system among the others. The Primer Primitives themes per palette stay for apps built
  on Primer React. The showcase Kit picker is `tailor` (HTML) | `react`, first in the footer (kit, skin,
  palette, mode). Why: React apps had every skin and palette in CSS but no switcher; a second React kit with
  its own look split the React path and could never take the skins. Rejected: per-skin overlays on the Primer
  kit (Primer would carry sub-themes) and a manifest field for them. Supersedes the 2026-10-20 Kit picker
  (`tailor` | `primer`) and the 2026-10-20 footer order (skin → palette → kit → mode).
- **2026-10-22 — tailor-react is vendored into React projects; the Primer theme generator is removed; "all"
  adopts later additions.** What: `apply --react` / `sync` write `vendor/tailor-react/` (package.json + src +
  LICENSE + README, managed header, pinned version) at the project's workspace root, so a React app builds on
  a fresh clone (CI, Docker); `tailor gen --target primer`, the 42 generated Primer themes, the palettes'
  `primer` sections and the manifest `primer_theme(s)` fields are gone (the `primer` skin and tailor-react cover
  the need); consumers recorded with `all` get new skins and palettes on `sync`. Why: public React apps built
  on GitHub where the local tailor checkout does not exist; no consumer used the generated themes; the 0.10.0 sync
  kept every consumer on its recorded skin list, so no one received the new `primer` skin. Supersedes the
  2026-10-20 "the React adapter never reaches consumers through apply/sync" and the 2026-10-16 Primer theme
  emitter.

## 5. Delivered (0.1.0)

- Skins: bootstrap, pico, simple, webtui, daisyui,
  luz, tufte, govuk, primer (0.10.0) — each 43/43 tier-1, translate-not-vendor, `--t-*` only, verified by
  `bin/verify` + showcase screenshots.
- `react/`: `Ui.*` components with markup parity (`react/bin/check-parity`, 43/43); the Primer kit
  adapter shipped up to 0.9.x and was removed in 0.10.0.
- `bin/tailor` CLI: `apply|sync|list|gen`, multi-skin vendoring, consumer registry, managed headers.
- Showcase Kit picker: the same demos in HTML or React (`showcase/kit/`, built by `bin/build`).
- 0.10.0: React theme switcher (`tailor-react/theme`: `useTailorTheme`, `Ui.Pickers`), `tailor apply --react`
  head snippet without `tailor.js`, showcase `react` kit, `skins/primer`; Primer kit adapter removed.
- 0.11.0: Primer Primitives theme generator removed (`tailor gen --target primer`, `react/adapters/primer/`,
  the palettes' `primer` sections); the `primer` skin is the Primer look.

## 6. Open

- CI: `.github/workflows/run-tests.yml` runs `bin/build` + `bin/verify` and the React typecheck on
  every push and pull request.
- More skins, palettes and icon sets per `CONTRIBUTING.md`.
- Astro as the bridge between the HTML and React paths (one component source rendering static tailor markup and
  React islands); the showcase would be the first candidate. Parked 2026-10-21, not evaluated yet.

# Contributing

## Run it locally

Bun ≥ 1.1 for the tooling; nothing to install at the repo root. The Primer themes need the pinned
`@primer/primitives`, which `bun install` in `react/` provides; the icon-set entries and sprites need the pinned
`@iconify-json/*` packages, which `bun install` in `icons/` provides (without either, `bin/build` keeps the
committed files and says so).

```sh
git clone https://github.com/rojosinalma/tailor && cd tailor
(cd react && bun install --frozen-lockfile)
(cd icons && bun install --frozen-lockfile)
bin/build                      # palettes/*.css, react/adapters/primer/themes/*, manifest.json, showcase/index.html + icons.svg
bunx serve .                   # open /showcase/
```

## Run the checks

```sh
bin/verify                     # schemas, skin coverage, CSS parse, palette contrast, Primer themes + icon sets current, showcase render
cd react && bun run typecheck && bun run check-parity
```

`bin/verify` is the gate for every change — green locally before a commit, green in CI
(`.github/workflows/run-tests.yml`) on every push and pull request.

## Where the docs live

`README.md` stays short; everything else is a topic file under `docs/` (`architecture.md`,
`usage.md`, `cli.md`, `configuration.md`, `icons.md`, `palette-licenses.md`, `SDD.md`). Skin notes go in
`skins/<id>/README.md`, the vocabulary contract in `core/conventions.md`. Add to the matching file
rather than to the README.

## Add a skin

1. `cp -r skins/_template skins/<id>`; set `id`, `name`, `system`, `vendor` in `manifest.json`.
2. Read `core/components.json`, `core/conventions.md`, `skins/SKIN-CONTRACT.md`, `core/base.css`.
3. Style every tier-1 component in `skin.css` (roots, parts, `data-variant/size/tone`, states).
   Colours only via `var(--t-*)`; default tones with `:where()`; never set a palette token; no JS;
   markup read-only. Translate the upstream look, do not vendor its CSS; if you must ship an asset
   it has to be MIT-compatible, live in the skin folder, be listed in `files.assets` and be
   imported from `skin.css`.
4. Fill `coverage` with every tier-1 id (`bun -e 'console.log(JSON.stringify(require("./manifest.json").vocabulary.tier1))'`),
   `tier2` with the extras you did, `palette_constraints.mode` honestly.
5. `bin/build` → open `/showcase/?skin=<id>&palette=dracula`, `…&mode=light`, `…&palette=gruvbox`
   from a static server at the repo root; card text readable, every component recognisable, zero
   console errors.
6. Write `skins/<id>/README.md` (build notes, gaps, palette notes). Add a CHANGELOG line.
7. `bin/verify` — exit 0.

## Add a palette

1. Author `palettes/src/<id>.json` against `palettes/src/palette.schema.json`. Fill `source` and
   `license` (SPDX id, or `values-only (<reason>)` when upstream has no usable licence — only colour
   values may be reused, never files or assets). Explain any substituted hue in `$comment`.
2. `bin/gen-palette <id>` (or `bin/build`) → `palettes/<id>.css`; inspect the header.
3. `bin/verify` — contrast floors (text/canvas ≥ 4.5, muted/canvas ≥ 4.5, text/surface ≥ 4.5,
   on-accent/accent-solid ≥ 3) must pass; lift `muted`/`danger` in the JSON if they do not and say so
   in `$comment`, as the existing palettes do.
4. `bin/build` → `manifest.json` lists it with a compatibility row per skin; check `?palette=<id>`
   with each skin in the showcase.
5. Optional but expected: a `primer` section (start from `dracula.json`'s: `map` for the GitHub surface,
   accent and state colours, `tokens` for the link and the primary button, `hue_ranges` to steer a hue family).
   `bin/gen-primer-theme <id>` prints the most frequent source colours and where they landed — tune until the
   Primer showcase of your choice reads right; `bin/build` writes `react/adapters/primer/themes/dark_<id>.css`
   and `index.ts`. Commit the palette and the generated theme together.
6. Add the palette to the table in `docs/palette-licenses.md` and a CHANGELOG line. `bin/verify`.

## Add an icon set

1. Pin `@iconify-json/<id>` in `icons/package.json`; `bun install` in `icons/` (commit `bun.lock`).
2. One line in `icons/sets.json`: id, name, SPDX licence (must equal the package's `info.json`), upstream URL.
   Only sets whose licence permits redistributing the icon data; no upstream file is ever copied into the repo.
3. `bin/build` → `manifest.json → icon_sets` + `showcase/icons.svg`; check the showcase's Icons section.
4. Add the row to `docs/icons.md` and a CHANGELOG line. `bin/verify`.

## Promote a component (tier 2 → tier 1) or add one

1. Edit `core/components.json`: set `tier: 1` (or add the entry: id, root `t-*`, parts, attributes,
   states, behaviour, a11y, markup, demo). Classes in markup must be the root, a part, or a base
   utility — verify checks.
2. If it needs behaviour: add `T.<fn>` to `core/tailor.js`, register it in `upgrade`, document it in
   `core/conventions.md §5`.
3. Give it a functional baseline in `core/base.css`.
4. `bin/build`; look at it in the showcase.
5. Every existing skin now has a coverage gap: `bin/verify` lists them. Fix each skin (or demote).
6. `react/`: add the `Ui.*` component and its parity fixture; `cd react && bun run check-parity`.
7. CHANGELOG (tier-1 additions are a minor bump). `bin/verify`.

## Change a contract

Token names, class/attribute conventions, `components.json` shape, manifest schemas, load order,
switcher protocol, CLI verbs and the managed-file header are stable (`docs/SDD.md §3`). Open an
issue first; a change bumps major/minor accordingly, updates `docs/SDD.md §3` and `CHANGELOG.md`,
and `bin/verify` must still pass.

## Commits and pull requests

Plain imperative messages ("Add kanagawa palette"), one change per commit, no attribution trailers.
A PR says what changed and why, links the issue for contract changes, and comes with `bin/verify`
green and a CHANGELOG line under `[Unreleased]`. Generated files (`palettes/*.css`, `manifest.json`,
`showcase/index.html`, `showcase/icons.svg`) are committed; run `bin/build` before committing so they are not stale
(verify warns). `consumers.json` is local state and is gitignored.

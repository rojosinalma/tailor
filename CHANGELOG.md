# Changelog

All notable changes to tailor. Semver; the `version` in `package.json` is the source.

## [Unreleased]

## [0.5.1] — 2026-10-16

### Fixed
- `base.css`: `.t-empty-icon` set `width/height: auto`, which gave a sprite `<svg class="t-icon t-empty-icon">` its 300×150
  intrinsic box; `.t-empty-icon.t-icon` is now `1em` (= the 2.5rem empty-state glyph size) for glyph spans and SVG alike.

## [0.5.0] — 2026-10-16

### Added
- Vocabulary gaps reported by the first fifteen consumers, now in core so their `app.css` workarounds can go:
  `t-btn[data-size="xs"]` (compact toolbar/icon buttons; token `--t-control-h-xs`, sized in every skin),
  `t-dialog[data-size="xl"]` (1140px, media and wide tables), `t-grid[data-cols="12"]` form grid with
  `data-span="1…12"` on any `.t-grid` child (unspanned children of the 12-grid fill the row; spans collapse below
  768px) and `t-grid[data-align]`, utilities `t-nowrap` and `t-hide[data-hide="xs|sm|md"]` (responsive hide,
  `sm` default), table `t-col-shrink` (1%-width column next to `t-col-icon`/`t-col-actions`), card header end
  slot `t-card-tools` (a cluster of actions/hints right of the title), `t-input/t-select/t-textarea[data-width="auto"]`
  (content-width controls for filter toolbars). `core/conventions.md §2` lists the fixed utility set and where
  child/control attributes are documented.

### Fixed
- `layout.css`: `.t-shell[data-sidebar="none"]` kept the 4-row stacked template below 992px, leaving an empty
  `1fr` row above the footer; it now keeps its 3 rows (`nav 1fr foot`) at every width.

## [0.4.0] — 2026-10-16

### Added
- `<div data-tailor-pickers>`: `Tailor.theme.init` renders the skin/palette/mode selects into it (skin and palette
  only when more than one is vendored); options are sorted alphabetically by name, the "none" skin last. Empty
  `[data-tailor-picker]` selects are filled the same way. The head snippet now carries `labels` (skin and palette
  names) for that; `.t-pickers` in `layout.css`. Convention (§8): the switcher goes in the footer when the layout
  has one, otherwise last in the navbar.

### Changed
- Showcase pickers sorted by name.

## [0.3.0] — 2026-10-16

### Added
- Icon sets, via Iconify JSON data: `icons/` pins `@iconify-json/bi` (Bootstrap Icons, MIT), `@iconify-json/lucide`
  (Lucide, ISC) and `@iconify-json/simple-icons` (Simple Icons, CC0-1.0); `icons/sets.json` is the adopted list
  (one line per set). `bin/build` writes `manifest.json → icon_sets[]` (id, prefix, name, version, licence, count,
  samples) and a sample sprite `showcase/icons.svg`; the showcase gains an **Icons** section. `bin/verify` checks
  the list, the pins, the licences against the installed data and the currency of both artefacts (warns when the
  packages are not installed). CI installs `icons/`.
- CLI: `tailor apply --icons <set:name,...>` renders a subsetted sprite `public/tailor/icons.svg`
  (`<symbol id="<set>-<name>">`, managed header naming every set and licence), recorded per consumer and kept
  current by `tailor sync`; `tailor icons search <term>` / `tailor icons list`; `tailor list` shows the sets.
- Vocabulary: `icon` (tier-2, root `t-icon`, `data-size`); `core/base.css` gives `.t-icon` `currentColor` and
  `data-size="xs|sm|lg|xl"`.
- `docs/icons.md`.

### Changed
- `core/conventions.md §2`: icons are tailor's business — the adopted sets, the sprite, `aria-hidden` /
  `role="img"` rules, no icon fonts (supersedes "`.t-icon` is a slot, icons are not tailor's business").

## [0.2.0] — 2026-10-16

### Changed
- Palette sources are canonical in the repo: `palettes/src/<id>.json` + `palette.schema.json`;
  `bin/gen-palette`/`bin/build` read them (`TAILOR_PALETTES` overrides the directory).
- `tailor gen <system> <palette>` (no `--target`) is an optional passthrough to an external generator located
  via `WEB_UI_DESIGN_ASSETS`.
- `consumers.json` is local state (gitignored); `consumers.example.json` is the template.
- Docs: README trimmed to description, requirements, setup and licence; topic docs under `docs/`
  (`architecture.md`, `usage.md`, `cli.md` — replaces `bin/CLI.md` —, `configuration.md`,
  `palette-licenses.md`); `docs/SDD.md`, CONTRIBUTING and `docs/RELEASE-0.1.0.md` revised.

### Added
- `tailor gen --target primer <palette> | --all` (`bin/gen-primer-theme`, `bin/lib/primer.js`): every palette with
  a `primer` section (hand-tuned colour map, token overrides, hue bands — now part of `palettes/src/<id>.json`,
  schema updated) becomes a Primer Primitives theme, `react/adapters/primer/themes/<mode>_<id>.css`, derived
  from the stock `@primer/primitives` dark theme pinned in `react/package.json`; 21 generated. `themes/index.ts`
  (generated) imports them all and exports `PRIMER_THEMES`, `PRIMER_THEME_LABELS`, `primerThemeProps`,
  `applyPrimerTheme`; exported as `tailor-react/primer/themes`. `bin/build` regenerates them, `bin/verify`
  checks presence, selector names and currency, `manifest.json` palettes carry `primer_theme`.
  `TAILOR_PRIMER_PRIMITIVES` overrides the primitives directory.
- CI: `.github/workflows/run-tests.yml` — `bin/build` + `bin/verify`, React typecheck.

### Removed
- `bin/export-showcase` (the showcase export is not part of the library).

## [0.1.0] — 2026-10-14

### Added
- Core: `--t-*` token contract (`core/tokens.css`, Dracula default + Alucard light), unskinned baseline
  (`core/base.css`), layout primitives (`core/layout.css`), behaviour layer (`core/tailor.js`).
- Vocabulary: `core/components.json` — 43 tier-1 components (shell, actions, navigation, forms, data,
  feedback) and 8 tier-2 seeds, with canonical markup; schema `core/components.schema.json`;
  conventions in `core/conventions.md`.
- Skin contract: `skins/SKIN-CONTRACT.md`, `skins/manifest.schema.json`, `skins/_template/`.
- Palettes: `bin/gen-palette` emits `palettes/<id>.css` from canonical palette JSON; 21 generated.
- Tooling: `bin/build` (palettes, `manifest.json`, showcase), `bin/verify` (contracts, coverage,
  contrast, parse, showcase).
- Showcase: `showcase/` static page rendering every tier-1 component once, `?skin= ?palette= ?mode= ?only=`; favicon (seam + needle).
- Docs: README, `docs/SDD.md`, CONTRIBUTING, MIT licence.
- Skins, each full tier-1 coverage (43/43), translate-not-vendor, `--t-*` only:
  `bootstrap` (Bootstrap 5 + Dracula look), `pico` (Pico CSS 2.1.1 character),
  `simple` (Simple.css 2.3.7, deliberately austere), `webtui` (@webtui/css 0.1.10 terminal look),
  `daisyui` (daisyUI 5.7.50, pill-and-squircle), `luz` (@d00m-gui/luz 0.5.0, tinted fills + depth),
  `tufte` (Tufte CSS book typography, printed-label chrome), `govuk` (GOV.UK Frontend 6.5.1 form
  language: 2px borders, fat focus, square corners).
- React adapter `react/` ("tailor-react"): 43/43 tier-1 as `Ui.*` on the CSS path with React
  behaviours, kit-adapter seam + Primer adapter (29 mapped, rest fall back), `bin/check-parity`.
- CLI `bin/tailor`: `apply | sync | list | gen`, managed-file headers, `consumers.json`, dry-run;
  `--skin` takes a comma list or `all` (first = default), so consumers can offer a runtime skin switcher.
- `bin/export-showcase <dest>`: self-contained copy (core, skins, palettes, showcase).

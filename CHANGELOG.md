# Changelog

All notable changes to tailor. Semver; the `version` in `package.json` is the source.

## [Unreleased]

### Changed
- Palette sources are canonical in the repo: `palettes/src/<id>.json` + `palette.schema.json`;
  `bin/gen-palette`/`bin/build` read them (`TAILOR_PALETTES` overrides the directory).
- `tailor gen` is an optional passthrough to an external generator located via `WEB_UI_DESIGN_ASSETS`.
- `consumers.json` is local state (gitignored); `consumers.example.json` is the template.
- Docs: README trimmed to description, requirements, setup and licence; topic docs under `docs/`
  (`architecture.md`, `usage.md`, `cli.md` — replaces `bin/CLI.md` —, `configuration.md`,
  `palette-licenses.md`); `docs/SDD.md`, CONTRIBUTING and `docs/RELEASE-0.1.0.md` revised.

### Added
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

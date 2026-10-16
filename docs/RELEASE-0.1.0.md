# tailor v0.1.0 — first public release

<!-- Draft of the GitHub release notes for tag v0.1.0. -->

**One component vocabulary, swappable skins, canonical palettes.** Write semantic HTML with `t-*`
classes once; pick the look (skin) and the colours (palette) as single CSS files, switchable at
runtime. No framework, no build step, no npm for consumers.

## Highlights

1. **Core contract**: `--t-*` tokens, functional baseline, layout primitives and a ~300-line
   behaviour layer (`core/tailor.js`: theme switcher, toasts, tabs, menus, dialogs, tooltips, …).
2. **43 tier-1 components** described in `core/components.json` (markup, attributes, aria states,
   behaviour) with a schema and written conventions.
3. **8 skins**, every one covering all 43 components: bootstrap, pico, simple, webtui, daisyui,
   luz, tufte, govuk — translations of the respective design systems, no vendored upstream CSS.
4. **21 palettes** generated from canonical JSON, each with a per-skin compatibility row and
   verified contrast floors.
5. **Showcase**: a static page rendering every component with skin / palette / mode pickers and
   deep links (`?skin=&palette=&mode=`).
6. **`tailor` CLI**: `apply | sync | list` vendor the assets into a project with managed-file
   headers and an idempotent sync; multi-skin vendoring enables runtime skin switchers.
7. **tailor-react**: the same vocabulary as `Ui.*` React components with a parity check against
   the canonical markup, plus a Primer kit adapter.
8. **`bin/verify`** gates everything: schemas, skin coverage, CSS parse, palette contrast,
   showcase render — also run in CI.

## Palette licences

Palettes reuse colour values only; each generated `palettes/<id>.css` cites source and licence.
17 are MIT, tokyonight is Apache-2.0, and three are *values-only* — gruvbox (no licence file
upstream), zenburn (GPL header, no licence file), modusvivendi (GPL-3.0-or-later) — meaning no
upstream code or assets are included, only the colour values with attribution. Details: `docs/palette-licenses.md`.

## Links

- Documentation: `README.md`, `docs/SDD.md`, `docs/usage.md`, `docs/cli.md`, `CONTRIBUTING.md`
- Changelog: `CHANGELOG.md` → `[0.1.0]`
- Licence: MIT

![Same markup, four skins](docs/showcase.png)

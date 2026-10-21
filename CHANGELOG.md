# Changelog

All notable changes to tailor. Semver; the `version` in `package.json` is the source.

## [0.10.0] — 2026-10-21

### Added
- **React theme switcher** (`tailor-react/theme`, also exported from `tailor-react`): `useTailorTheme()` and
  `<Ui.Pickers>` switch every skin, palette and mode in a React app without `tailor.js`. Same query params,
  `localStorage` keys, mode clamp, `<html>` attributes, link re-pointing and `t:theme` event as `Tailor.theme`;
  one state per page, SSR-safe; on a page that also loads `tailor.js` both stay in one state. The pickers render
  the `renderPickers` markup with drawn selects.
- **`primer` skin**: the Primer look (system font, 14px text, 6px radius, 32px controls, UnderlineNav tabs,
  Label/Counter pills, Box cards, ActionList menus) in tailor markup, 43/43 tier-1, every palette in both modes.
- Showcase Kit picker: **HTML** | **React**. React renders the demos through tailor-react with every skin
  selectable, and the footer pickers become `Ui.Pickers`.
- `tailor sync` prints a `warning` line for a consumer whose repo is public (or of unknown visibility) and keeps
  no `.git/info/leak-patterns`. Private repos and repos without a remote stay quiet; the exit code never changes.

- **tailor-react matches the upgraded HTML**: after mount every `Ui.*` component has the DOM, strings and
  interactions `Tailor.upgrade` gives the same HTML. New React behaviours: drawn select (`Ui.Select`), number
  steppers (`Ui.Input type="number"`, `Ui.DurationInput`), form validation (**`Ui.Form`**), settings autosave with
  toast and revert on failure (`Ui.Settings save`), sortable rows (`Ui.Table sortable` + `Ui.Table.Body`), one
  popup at a time with flip/align for menus and pinned help (shared with `Tailor.popup` when both are loaded).
  The server render stays the canonical markup (no hydration mismatch, check-parity 43/43); see react/README.md
  "Drawn controls".
- New props: `Menu variant`, `Menu.Item defaultChecked/onCheckedChange`, `Tabs panelClassName`, `Segmented`
  option `tip`, `Badge as="button"`, `Alert dismissible`, `Dialog size="xl"` + `data-dialog-close` values,
  `Progress label`, `Code onTabChange`, `RelativeTime ago/tip`, `Table.Th/Td shrink`, `Page as`, `Section
  bodyClassName`, `Input htmlSize`, `Footer.Pickers parts/size`; `useOptionalToasts()`, `popup`, exported prop types.
- The showcase's React kit renders every tier-1 demo with the content of its HTML demo (all variants, texts and
  demo interactions: settings save mock with a failing row, dialog Save toast, confirm results, chip remove,
  password reveal, live range output).

### Changed
- The Kit select comes first in the pickers (kit, skin, palette, mode), in `Tailor.theme.renderPickers` and the
  showcase footer.
- The showcase kit bundle is `showcase/kit/kit.js` only (314 KB, was 952 KB + 226 KB CSS).

### Removed
- **The Primer kit adapter** (`tailor-react/primer`: the Primer `Ui`, its pickers) and the `@primer/react`
  dependency; the showcase's Primer kit goes with it. tailor-react is the one React kit; use the `primer` skin
  for the Primer look. The Primer Primitives themes per palette (`tailor-react/primer/themes`,
  `tailor gen --target primer`) stay for apps built on Primer React.

### Fixed
- `tailor apply --react` no longer writes the `tailor.js` `<script>` and the `Tailor.theme.init` call into
  `tailor-head.html`: the file is not vendored under `--react`, so the snippet loaded a missing script.
- A `.t-duration` with `data-value` outside a settings form now shows its value on load (`Tailor.durations`,
  run by `Tailor.upgrade`); the showcase demo showed an empty field and the wrong unit.
- The React tooltip layer stays off when `tailor.js` is also on the page (no double tooltips) and follows a
  changed `data-tip` while it is open.
- tailor-react: `relativeTime()` returns the `Tailor.relativeTime` strings ("2 h ago", "yesterday", "4 d ago",
  "Sep 21") and `Ui.RelativeTime` sets the absolute time as `data-tip`; it said "2 hours ago" and had no tip.
- tailor-react: `Ui.DurationInput` with `value` and no `onChange` no longer reverts what is typed.
- tailor-react: a plain menu item click closes the menu; checkbox items toggle without a controlling parent.
- tailor-react: `Ui.SettingsRow` toasts the save result and reverts the control when the save fails.
- tailor-react: `Ui.AppShell` no longer nests a `<Ui.Navbar>`/`<Ui.Footer>` passed as `nav`/`foot` in a second
  navbar/footer; `Ui.Footer.Pickers` renders the switcher instead of an empty host.
- tailor-react: `Ui.Truncate expand` is keyboard-reachable (`tabindex`, `role="button"`, Enter / Space); chip
  remove, code tabs and sort-header buttons carry `type="button"`; toasts go into an existing `#t-toasts`.
- Showcase footer demo: the stale "tailor 0.1.0" version string is "v0.9.2" like the other demos, and the mode
  toggle is a live `data-tailor-pickers="mode"` switcher in both kits.

## [0.9.2] — 2026-10-21

### Fixed
- Children of `.t-stack` and `.t-split-pane` no longer shrink (`flex-shrink: 0`, zero specificity). In a
  height-bound scroller such as `.t-shell-main` on a short screen, cards (and any other clipping child) shrank
  to fit, cut their body, and the scroller had nothing to scroll. A class rule that sets `flex` on a child still
  wins, so a pane that fills and scrolls keeps working.
- `.t-tone-text` keeps its tone colour on a stat value, a facts `dd` (bootstrap), a table cell (pico) and a
  hovered table row (bootstrap); the component's own colour rule used to win over the utility.

## [0.9.1] — 2026-10-21

### Fixed
- `.t-icon` sets `max-width: none`, so an icon in a shrink-to-fit cell (`.t-col-icon`, `.t-col-shrink`) keeps its
  1em size. The `svg { max-width: 100% }` reset let the cell collapse and drew the icon at 0 width in every skin.

## [0.9.0] — 2026-10-21

### Added
- **`tailor move <old-dir> <new-dir> [-n]`** repoints a recorded consumer after its project moved: only `path`
  changes in `consumers.json`, every other field is kept, and `<old-dir>` may already be gone. Refuses (exit 1,
  with the reason) when `<old-dir>` is not recorded, `<new-dir>` is not a directory or already recorded, or both
  paths are the same. A re-apply at the new path used to record a second consumer and keep the stale one.
- **`tailor forget <dir> [-n]`** removes a recorded consumer for a retired project; the project's files are
  never touched. Refuses when `<dir>` is not recorded.

### Changed
- `tailor sync` on a consumer whose directory is gone now hints `tailor move <old> <new>` (moved) or
  `tailor forget <dir>` (retired) instead of asking for a hand edit of `consumers.json`.

## [0.8.1] — 2026-10-20

### Fixed
- luz and daisyUI skins: `.t-select` keeps `padding-right: 2rem`, so the drawn select's label never runs under
  the chevron (the skins' padding shorthand dropped the room the base reserves).

## [0.8.0] — 2026-10-20

### Changed
- **App shell is viewport-bound**: header and footer stay put, `.t-shell-main` and `.t-shell-side` scroll
  themselves, the document never scrolls (no scrollbar beside the fixed bars). Anchors land below the header
  (`scroll-padding-top`); `Tailor.scrollspy` reads the main scroller and highlights the last link once the
  scroller is at its end. Below 992px the sidebar stacks above main (up to 40dvh, then scrolls).
- **One floating panel at a time**: help popovers and `details.t-menu` go through `T.popup` like selects and
  pickers; Escape / outside click close whichever is open.
- `.t-select-list` grows to its longest option (`max-content`, min = trigger width, max 24rem); every panel
  right-aligns at the viewport edge (`data-align="end"`) and flips up (`data-at="top"`).
- Containers that clip (`.t-card`, `.t-list`, `.t-table-wrap`, `.t-dialog-body`) turn `overflow: visible` and
  lift above their siblings while a picker, select list, help box or menu is open inside — no more chopped
  date pickers.
- Footer pickers are `data-size="xs"` (new `xs` size for `.t-input`/`.t-select`/`.t-textarea`); order is skin,
  palette, kit, then the sun/moon toggle last.
- `.t-sidebar-group` titles are `--t-text-base` bold, larger than the items, in core and every skin.
- `.t-help` sits centred on its text line; `.t-help-btn` is smaller (0.9em circle, 0.7em glyph, 1px border) and
  no longer sets `cursor: help`.
- Bare `.t-toolbar`/`.t-cluster` followed by a sibling get a `--t-space-3` bottom gap (not inside `.t-stack`,
  `.t-cluster`, `.t-grid`, `.t-toolbar`).
- tailor.js draws sprite icons (toasts, confirm, number steppers, picker buttons) when `Tailor.theme.icons` is
  set, text glyphs otherwise; `tailor apply` always vendors those symbols. Showcase demos use sprite icons
  instead of text glyphs (which rendered as boxes).
- React: `Ui.Icon name="bi-…"` sprite form, `UiProvider sprite=` overrides the sprite URL, `tip` replaces
  `title` on `Truncate`/`Dot`/`Footer.Repo`, `Card.Tools`, `Footer.Pickers`, `Button size="xs"`; parity 43/43.

### Added
- Showcase **Kit picker** (`tailor` | `primer`, `?kit=`): the Primer kit renders the same demos as the HTML
  through React islands from `showcase/kit/kit.js` + `kit.css`, a Vite bundle `bin/build` makes from
  `react/demo/src/kit.tsx` (kept as committed when `react/node_modules` is missing; `--no-kit` skips it).
  `Tailor.theme` gains `kits`/`kit` (get/set/store/`?kit=`/`html[data-kit]`/`t:theme`) and a kit select in
  `renderPickers` when there is a choice. `.sc-demo` carries `data-component-id`.
- **Light Primer themes**: `tailor gen --target primer` writes `light_<id>.css` next to `dark_<id>.css` for
  every palette with a light block (21 × 2 = 42), derived from the dark mapping; `themes/index.ts` lists both;
  `manifest.json` palettes gain `primer_themes` per mode; `bin/verify` checks both.
- `react/parity/fixtures.tsx` exports `makeFixtures(Ui)` so the same fixtures render over any Ui surface.

### Fixed
- Primer adapter: `Ui.Alert` and toasts give Banner the required (hidden) title instead of throwing;
  `Navbar.Sep` returns a fragment.

## [0.7.1] — 2026-10-19

### Fixed
- `Tailor.selects` copies `data-tip`/`data-tip-at` from the native select to the drawn button, so a tooltip on a
  select shows again.
- `.t-tooltip` keeps line breaks (`white-space: pre-line`) for multi-line `data-tip` text.
- `.t-number` input text is left-aligned like every other input (was centred).

## [0.7.0] — 2026-10-19

Nothing browser-native. Every form control the browser used to draw itself is now drawn by tailor with tokens;
the native element stays in the DOM (hidden) so forms, `.value` and `change` listeners keep working, and
`Tailor.upgrade` does the rest — consumers change no markup.

### Added
- `Tailor.selects`: every `select.t-select` becomes a drawn button (`.t-select-btn`, painted by the skin like the
  native one) plus a listbox popup (`.t-select-list`, optgroup headers, type-ahead, Home/End, flip-up, one popup
  open at a time). `data-native` opts out, `data-placeholder` labels an empty choice. Tier-2 `select`.
- `Tailor.numbers`: native spinners hidden; `−`/`+` steppers (`.t-number`) honouring min/max/step, hold-repeat;
  fuses into `.t-duration`. `data-steppers="none"` opts out. Tier-2 `number`.
- `Tailor.files`: `.t-file` (button + chosen name), `data-variant="drop"` drop zone honouring `accept`/`multiple`.
  Tier-2 `file`.
- `Tailor.dates` / `Tailor.clocks` / `Tailor.colors`: drawn calendar (Monday first, min/max, Today/Clear),
  hour/minute(/second) columns from `step`, palette swatches from the live `--t-*` tokens with an optional hex
  field (`data-hex="none"`). Tier-2 `date`, `time`, `color`, shared `.t-picker` popup.
- `Tailor.forms` / `Tailor.validate(form)`: `novalidate` on every form, invalid controls get `aria-invalid` and
  their `validationMessage` drawn into `.t-feedback`; `data-validate="live"` validates on blur,
  `data-native-validation` opts out. Tier-2 `form`.
- `Tailor.popup` (shared open/close/flip for drawn popups) and `Tailor.sync(el)` for programmatic value changes.
- Showcase: a "Tier 2 (drawn controls)" group renders every tier-2 component that has a demo.

### Changed
- `title=` is banned: every tooltip is `data-tip` (`Tailor.tooltips` is now document-level delegation, so
  dynamically inserted elements need no re-run); `bin/verify` fails on a `title=` attribute in markup/demo or the
  generated showcase. Relative times and the mode toggle use `data-tip`.
- `core/conventions.md §4`: "Nothing browser-native" paragraph lists every control and its opt-out.

## [0.6.1] — 2026-10-19

### Changed
- Palette names are mode-neutral now that every palette ships dark and light: Ayu, Catppuccin, Everforest, Flexoki,
  Gruvbox, Kanagawa, Modus, Atom One, Oxocarbon, Selenized, Solarized, Vitesse (ids unchanged).

### Fixed
- `layout.css`: `.t-pickers` inside a `.t-setting-control` stacks its selects at the control width — two side by
  side truncated the labels in the 560px settings column.

## [0.6.0] — 2026-10-19

### Changed
- `layout.css`: `.t-shell` is single-column (full width) by default; the sidebar column exists only while a
  `.t-shell-side` child is present (`:has()`), on desktop and in the stacked ≤991px template. Until now the shell
  reserved a 220px `side` column unconditionally, so every consumer without `data-sidebar="none"` rendered its
  content shifted right by the sidebar width. `data-sidebar="none"` (hide an existing sidebar) and `collapsed`
  keep working; a shell without a sidebar needs no attribute.
- `tokens.css`: `--t-content-max` defaults to `none` (was 1400px) — `.t-page` spans the viewport; set the token
  to cap it.
- Switcher: `[data-tailor-pickers]` renders a **sun/moon mode toggle** (`[data-tailor-mode-toggle]`, icons
  `bi:sun`/`bi:moon-stars` from the consumer sprite, disabled when the palette has one mode) followed by the skin
  and palette selects; the mode `<select>` and its "Auto" option are gone (`auto` stays as a first-visit default,
  resolved from `prefers-color-scheme` until the user toggles). `data-tailor-pickers="mode"` / `"skin palette"`
  renders a subset so the selects can live on a settings page while the toggle stays in the footer.
  Placement rule (conventions §8): toggle first in `.t-footer-end`; selects on the settings page when there is
  one, otherwise next to the toggle. `Tailor.theme.init` reads `base` (→ `icons`) from the head-snippet config.
- CLI: `tailor apply` defaults to `--skin all --palettes all --mode auto`; `all` expands in place so
  `--palettes gruvbox,all` = every palette with gruvbox as default. The sprite always carries the two toggle
  icons. Adopting tailor = everything it ships at that moment; later skins/palettes reach consumers via
  `tailor sync`.
- Showcase: switcher moved from the navbar to the footer per the placement rule; sprite includes the toggle icons.

### Added
- Every palette now has a light counterpart (21/21, was dracula only): ayu (Ayu Light), catppuccin (Latte),
  everforest (Light medium), flexoki (Light), gruvbox (Light medium), kanagawa (Lotus), modusvivendi (Modus
  Operandi), nightfox (Dayfox), nightowl (Night Owl Light), onedark (One Light), oxocarbon (Light), rosepine
  (Dawn), selenized (Light), solarized (Light), tokyonight (Day), vitesse (Light) from the upstream light
  variants; nord, poimandres, synthwave84 and zenburn derived in OKLCH from their dark values (no upstream light
  exists; marked in each `$comment`). Text-role colours darkened where upstream fell under 4.5:1 — each
  `$comment` lists them; `bin/verify` gates every block.

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

# tailor markup conventions

The contract between tailor markup (what projects and the React adapter emit), skins (what styles
it) and tailor.js (what animates it). `core/components.json` is the machine-readable form; this file
is the rationale and the rules that do not fit a JSON field. When they disagree, components.json wins
and this file gets fixed.

## 1. Three layers, one direction

```
palette  (--t-* colour values)      ←  palettes/<id>.css, generated from the canonical JSON
   ↓
core     (tokens, base, layout, js) ←  core/*.css + core/tailor.js — the vocabulary
   ↓
skin     (appearance of t-* classes) ← skins/<id>/skin.css — one design system's look
   ↓
project  (markup only)              ←  uses t-* classes + data-* attributes; no CSS of its own for tailor parts
```

Load order in a page: `core/tokens.css` → `core/base.css` → `core/layout.css` → `skins/<id>/skin.css`
→ `palettes/<id>.css` → the project's own `app.css`. The palette file comes **after** the skin so a
skin's own colour defaults (if any) lose to the palette tokens. `core/tailor.js` at the end of body.

## 2. Naming

| Thing | Form | Example |
|---|---|---|
| Component root | `t-<component>` | `t-btn`, `t-card`, `t-table` |
| Element inside a component | `t-<component>-<part>` | `t-card-header`, `t-list-item`, `t-dialog-footer` |
| Variant / appearance | `data-variant="<value>"` | `data-variant="primary"`, `data-variant="log"` |
| Colour meaning | `data-tone="<tone>"` | `data-tone="danger"`, `data-tone="purple"` |
| Size | `data-size="xs|sm|md|lg|xl"` (md is the default, never written) | `data-size="sm"` |
| Component-specific enum | `data-<name>` documented in components.json | `data-status`, `data-state`, `data-cols` |
| State | native pseudo-class or aria attribute (§4), `data-state` only for states aria has no word for | `:disabled`, `aria-selected`, `data-state="saving"` |
| Token | `--t-<name>` | `--t-accent`, `--t-space-3` |
| JS hook | `data-tailor-*` or the component's documented `data-*` | `data-dialog-open`, `data-tip` |
| Utility class | `t-<utility>` from the fixed list in base.css | `t-muted`, `t-small`, `t-mono`, `t-truncate`, `t-nowrap`, `t-hide[data-hide]`, `t-visually-hidden` |

Rules:

- **No modifier classes.** `t-btn-primary`, `t-badge--lg`, `is-active` do not exist. Variants, tones,
  sizes and states are attributes, so a skin's selector is always `.t-x[data-variant="y"]` and a
  project never has to know a skin's class names.
- `data-variant` may hold several space-separated values when components.json lists them as
  combinable (card: `data-variant="thumb clickable"`); skins match with `[data-variant~="thumb"]`.
- Tones are the fixed list in `components.json → tones`: six semantic (`neutral accent success warning
  danger info`), `text`, and seven hues (`red orange yellow green cyan purple pink`). Semantic tones
  carry meaning (green = healthy, orange = degraded, red = failed); hue tones are decoration (an
  avatar's colour, a chart series). `tokens.css` resolves every tone to `--t-tone` once, so a skin
  styles `color: var(--t-tone)` and never enumerates tones. A component's **default** tone (what it
  shows with no `data-tone`) is declared at zero specificity — `:where(.t-badge) { --t-tone: … }` — so
  the `[data-tone]` rule in tokens.css always wins. Skins must use `:where()` for their defaults too.
- **Icons come from tailor's adopted icon sets.** tailor ships icon *sets* (it never draws icons):
  the adopted ones are `icons/sets.json` → `manifest.json → icon_sets` (Bootstrap Icons, Lucide,
  Simple Icons to start; data via Iconify JSON). A project declares the icons it uses
  (`tailor apply <dir> --icons bi:house,lucide:settings`) and gets one subsetted sprite,
  `public/tailor/icons.svg`, with a `<symbol id="<set>-<name>">` per icon. Markup:

  ```html
  <svg class="t-icon" aria-hidden="true"><use href="/tailor/icons.svg#bi-house"/></svg>
  <svg class="t-icon" role="img"><title>GitHub</title><use href="/tailor/icons.svg#simple-icons-github"/></svg>
  ```

  `.t-icon` is the slot: 1em square, `currentColor` (every shipped glyph uses it, so tones and
  text colour apply), `data-size="xs|sm|lg|xl"` scales it. Skins size and align `.t-icon` and
  never assume an icon font — **icon fonts are not used**. Decorative icons carry
  `aria-hidden="true"`; an icon that carries meaning on its own is `role="img"` with a `<title>`
  (or the control around it has `aria-label`). Any inline `<svg>` or Unicode glyph may still sit in
  the slot, but a hand-drawn glyph is for things no adopted set has; `tailor icons search <term>`
  finds names. The showcase uses Unicode glyphs in its chrome (no dependency) and shows the sets
  through its own sprite. Details: `docs/icons.md`.
- The utility list is fixed: `t-muted` `t-small` `t-mono` `t-tone-text` `t-truncate` `t-nowrap` `t-hide`
  `t-visually-hidden` `t-plain-list` `t-icon`. `t-hide` is the responsive hide: gone below the breakpoint in
  `data-hide="xs|sm|md"` (<576 / <768 / <992; `sm` when omitted); `[hidden]` is the unconditional one.
  Layout attributes that sit on **children** are documented on the parent in components.json
  (`t-grid > [data-span="1…12"]`); attributes that change a control's box are on the control
  (`t-input[data-width="auto"]`). Nothing else in a project's markup carries a `data-*` tailor reads.
- Prefix `t-` is reserved. Projects name their own things without it.

## 3. Semantic HTML first

- Use the element that means the thing: `<button>` for actions, `<a href>` for navigation, `<nav>`,
  `<main>`, `<header>`, `<footer>`, `<aside>`, `<section>`, `<dialog>`, `<details>/<summary>`,
  `<table>` for tabular data, `<time datetime>`, `<dl>` for facts, `<fieldset>/<legend>` for groups,
  `<output>` for live values, `<kbd>`, `<code>`, `<pre>`.
- Behaviour that the browser gives for free is used as-is: `<details>` for menus, collapsible cards and
  nested sidebar groups; `<dialog>` for dialogs and drawers; radios for segmented controls; `[hidden]`
  for inactive panels. tailor.js adds keyboard polish and focus management on top, never a parallel
  implementation.
- Exactly one `<h1>` (`.t-page-title`) per page; cards and dialogs use `<h2>`/`<h3>`.
- Every form control has a `<label for>` (or `aria-label`). Inline `style` is allowed for one thing
  only: passing a value through a custom property (`style="--t-value: 62%"`). Never for colours or
  layout.
- Text content is never generated by CSS except decorative glyphs (sort arrows, check marks, chevrons).

## 4. State vocabulary (aria first)

| State | How it is written | Who sets it |
|---|---|---|
| Current page / section in a nav | `aria-current="page"` (`"step"` in a stepper) | server / scrollspy |
| Selected item (list, card, tab, palette) | `aria-selected="true|false"` | tailor.js / project |
| Toggle pressed (filter, pin) | `aria-pressed="true|false"` | project / Tailor.filters |
| Checked menu item | `aria-checked="true|false"` on `role=menuitemcheckbox` | project |
| Expanded trigger (help, sidebar group) | `aria-expanded="true|false"` (or `details[open]`) | tailor.js |
| Invalid control | `aria-invalid="true"` + `aria-describedby` → the `.t-feedback` | server / project |
| Loading | `aria-busy="true"` (plus `disabled` on buttons) | project |
| Disabled | `disabled` on form controls and buttons; `aria-disabled="true"` on links | project |
| Hidden | the `hidden` attribute | tailor.js |
| Sort | `aria-sort="ascending|descending|none"` on `<th>` | Tailor.sortable / server |
| Open dialog / details | `[open]` | browser |
| Saving / saved / failed row | `data-state="saving|saved|failed"` | Tailor.settingsAutoSave |
| Pinned popover | `data-pinned` | Tailor.help |
| Leaving toast | `data-leaving` | Tailor.toast |

Skins style **these** selectors. A skin that needs `.active` or `.is-open` is wrong and `bin/verify`
will not catch it — review does.

## 5. Behaviour contract (tailor.js)

`core/tailor.js` exposes `window.Tailor` and, on `DOMContentLoaded`, runs `Tailor.upgrade(document)`
unless its `<script>` carries `data-tailor="manual"`. `upgrade(root)` wires every component whose
`behaviour` in components.json is `js:Tailor.<fn>`; call it again after injecting markup. The
functions are:

| Function | Wires | Notes |
|---|---|---|
| `Tailor.theme.init({project, skins, palettes, modes, defaults})` | `data-skin`/`data-palette`/`data-mode` on `<html>`, `<link id="t-skin">`, `<link id="t-palette">`, pickers `[data-tailor-picker="skin|palette|mode"]`, `[data-tailor-mode-toggle]` | storage keys `<project>.skin` `<project>.palette` `<project>.mode`; `?skin= ?palette= ?mode=` win for the first paint only |
| `Tailor.toast(tone, msg, {timeout})` | appends to `#t-toasts` (created if missing) | `error` → `danger` |
| `Tailor.tabs(root)` | `.t-tabs` | roving tabindex, ←→ Home End, `hidden` on panels |
| `Tailor.listbox(root)` | `.t-list[role=listbox]` | click/Space/Enter toggle, ↑↓ move; emits `t:change` on the list with `{selected: [...]}` |
| `Tailor.menus(root)` | `details.t-menu` | outside click / Esc closes; check items toggle `aria-checked` |
| `Tailor.dialogs(root)` | `[data-dialog-open]`, `[data-dialog-close]`, `dialog.t-dialog`/`.t-drawer` | backdrop click closes; returnValue = the close button's value |
| `Tailor.confirm(title, bodyHtml, {label='Confirm', danger=true})` | `#t-confirm` | `Promise<boolean>` |
| `Tailor.times(root)` + `Tailor.relativeTime(date)` | `time.t-time[data-relative]` | re-paints every minute; `data-ago="<s>"` is a demo-only shortcut |
| `Tailor.tooltips(root)` | `[data-tip]` | one shared `.t-tooltip[role=tooltip]` |
| `Tailor.help(root)` | `.t-help` | click pins, hover 1 s peeks, outside/Esc closes |
| `Tailor.copy(root)` | `.t-code-copy`, `.t-code-tabs` | strips the prompt and line continuations; `data-copied` for 1.2 s |
| `Tailor.truncate(root)` | `.t-truncate[data-expand]` | toggles `aria-expanded` |
| `Tailor.dismiss(root)` | `[data-dismiss]` | removes the closest `.t-alert`/`.t-toast` |
| `Tailor.filters(root)` | `.t-btn-group[data-role=filter]` | single-select `aria-pressed`; emits `t:change` |
| `Tailor.settingsAutoSave(root, save)` + `Tailor.duration.get/set` | `.t-setting`, `.t-duration` | `save(key, value)` → `Promise<{ok, message}>`; revert on error |
| `Tailor.sortable(table)` | `.t-table th[data-sort]` | client-side sort by `data-<key>` on rows or cell text; sets `aria-sort` |
| `Tailor.scrollspy(nav, sections)` | `.t-sidebar a[href^="#"]` | `aria-current="page"` on the link of the section in view |

Custom events are namespaced `t:` and bubble. tailor.js never reads a skin class and never injects
colours; it toggles only the attributes in §4 plus `hidden`.

## 6. What a skin may and may not do

May:

- Style every `t-*` class and `data-*`/aria state listed in components.json, with any CSS it likes,
  including `@import`/vendored CSS of its design system (Bootstrap, Pico, daisyUI…), as long as the
  result is one `skin.css` (plus assets it ships in its folder).
- Override **scale** tokens (`--t-radius-*`, `--t-space-*`, `--t-font-*`, `--t-shadow-*`,
  `--t-control-h*`) in its own `:root` block to match its system's feel.
- Map its system's native variables onto `--t-*` (e.g. `--bs-body-bg: var(--t-canvas)`) so the
  vendored CSS follows the palette.
- Declare in `manifest.json` which tier-1 components it covers (must be all of them) and which tier-2
  ones; which modes it supports (`dark`, `light`, `both`); extra needs.

May not:

- Require different markup, extra wrapper elements, extra classes or ids. If the system needs a class
  the tailor markup lacks (`class="btn btn-primary"`), the skin selects the tailor attribute instead
  (`.t-btn[data-variant="primary"] { @extend-like rules }`) — in plain CSS that means re-declaring the
  properties, or using `:is()`/`:where()` to alias selectors. Vendored CSS that cannot be aliased is
  not used.
- Set **palette** colour tokens (`--t-canvas` … `--t-hue-*`). Those come from palettes only.
- Use hex, `rgb()`, named colours. Every colour is `var(--t-*)` or `color-mix()` of them. Tints use
  `color-mix(in srgb, var(--t-tone) var(--t-tint-weak), transparent)`, never `rgba()` literals.
- Ship JS. Behaviour is tailor.js; a skin that needs the kit's JS (Bootstrap's dropdown) must not —
  the tailor markup already works without it.
- Restyle scrollbars, change `--t-nav-h`/`--t-footer-h`/`--t-sidebar-w`/`--t-gutter` (layout metrics
  are core), or reposition shell slots.

## 7. Base vs skin

`core/base.css` is the **unskinned baseline**: a light reset, readable typography, and the minimum
rules that make every component *function* (hidden panels hidden, dialogs centred, toasts stacked,
tooltips positioned, visually-hidden radios in segmented controls, truncation). It is deliberately
plain so an unskinned page is usable, not pretty. Skins load after it and may override anything in
it; they should not need to undo it.

## 8. Project rules (consumers)

- Vendor `core/`, one or more `skins/<id>/`, the `palettes/*.css` you offer, your icon sprite
  (`--icons`) and `tailor.js` via the `tailor` CLI (header `/* managed by tailor <version> — do not edit */`). Never edit vendored files.
- `app.css` holds the project's own components, named without the `t-` prefix, coloured with `--t-*`
  tokens only.
- The pre-paint snippet from `docs/SDD.md § Switcher` goes in `<head>` right after the three core `<link>`s (it writes the skin and palette links there, so they cascade over `tokens.css`).
- Palette and skin are app settings (settings table); localStorage is only the flash cache.
- **The switcher is one element**: `<div data-tailor-pickers></div>`. `Tailor.theme` renders the skin,
  palette and mode `<select>`s into it (skin/palette only when the project vendors more than one),
  options **sorted alphabetically by name** from the vendored config — never hand-write option lists.
  A bare `<select data-tailor-picker="skin|palette|mode">` with no options is filled the same way.
  **Placement: in `.t-footer-end` when the layout has a footer, otherwise last in `.t-navbar-end`.**

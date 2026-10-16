# Skin contract

A **skin** renders the tailor vocabulary in one design system's look. It is one folder:

```
skins/<id>/
  manifest.json     declares id, system, coverage, palette constraints, vendor info (schema: skins/manifest.schema.json)
  skin.css          styles every t-* class in core/components.json (may @import files in this folder)
  README.md         how it was built, known gaps, what was vendored and under which licence
  [vendor/…]        optional vendored upstream CSS (MIT-compatible only), referenced by skin.css
  [build]           optional script that regenerates skin.css (Bun, no network at verify time)
```

`skins/_template/` is a copy-and-rename start. Nothing outside the folder changes when a skin is
added; `bin/build` picks it up and `bin/verify` checks it.

## What you implement

Read, in this order: `core/components.json` (the markup you style — every `root`, `parts`,
`attributes`, `states`), `core/conventions.md` (naming, aria states, what skins may not do),
`core/base.css` (what already works without you — you override its look, you never have to undo
its function), `core/tokens.css` (the only colours you may use).

For every **tier-1** component: style the root class, each part class, each `data-variant` /
`data-size` / `data-tone` value and each state selector listed. The showcase (`bin/build`, then open
`showcase/index.html?skin=<id>`) renders every one once in tailor markup; that page is the acceptance
test. Tier-2 components are optional; list the ones you did in `tier2`.

## Hard rules (verify enforces the first four)

1. `manifest.json` validates against `skins/manifest.schema.json`.
2. `coverage` ⊇ every tier-1 id in `core/components.json`. Missing ids → FAIL with the list.
3. `skin.css` parses (balanced braces; lightningcss when available).
4. No palette colour tokens are *set* in `skin.css` (`--t-canvas` … `--t-hue-*`, `--t-accent*`,
   `--t-on-accent`, `--t-link`, `--t-success|warning|danger|info`, `--t-text|muted|disabled`,
   `--t-inset|surface|selection|border|overlay-bg`). Reading them is the whole point; setting them
   is a palette's job. No hex / rgb() / hsl() / named colours either, except inside `url("data:…svg")`.
5. Markup is read-only. You never require an extra class, wrapper, id or attribute. If your system
   needs `.btn.btn-primary`, you write `.t-btn[data-variant="primary"] { …the same declarations… }`
   or alias with `:is()`/`:where()`. Vendored CSS that cannot be aliased stays out.
6. No JavaScript. tailor.js is the only behaviour layer; it toggles aria/data attributes you style.
7. Layout metrics (`--t-nav-h`, `--t-footer-h`, `--t-sidebar-w`, `--t-gutter`, shell grid) are
   core. Scale tokens (`--t-radius-*`, `--t-space-*`, `--t-font-*`, `--t-shadow-*`,
   `--t-control-h*`) may be overridden in your `:root` block — list them in `tokens_overridden`.
8. `palette_constraints.mode` is honest: `both` only if you checked light palettes (Dracula's
   Alucard block, `?palette=dracula&mode=light`) and dark ones.
9. Every colour-carrying element reads `var(--t-tone)` for its tone (tokens.css sets it from
   `data-tone`), so a new tone needs no skin change. Component default tones are declared at zero
   specificity: `:where(.t-badge) { --t-tone: var(--t-disabled); }` — a plain `.t-badge { --t-tone }`
   would beat `[data-tone]` by source order and silence every tone.
10. Scrollbars come from base.css; do not restyle them.

## Mapping a system onto the vocabulary

| tailor | Bootstrap 5 | Pico | daisyUI | WebTUI |
|---|---|---|---|---|
| `.t-btn[data-variant=primary]` | `.btn.btn-primary` | `button` | `.btn.btn-primary` | `button[variant-=…]` |
| `.t-btn` (secondary) | `.btn.btn-outline-secondary` | `button.secondary.outline` | `.btn.btn-outline` | `button` |
| `.t-badge[data-tone=x]` | `.badge` + tint | `mark`-ish | `.badge.badge-outline` | `[is-~=badge]` |
| `.t-card` / `-header` / `-body` | `.card` / `.card-header` / `.card-body` | `article > header` | `.card` / `.card-body` | `[box-]` |
| `.t-input` / `.t-select` | `.form-control` / `.form-select` | `input` / `select` | `.input` / `.select` | `input` |
| `.t-dialog` | `.modal-content` (but on `<dialog>`) | `dialog > article` | `.modal-box` | `dialog` |
| `.t-table` | `.table.table-hover` | `table` | `.table` | `table` |
| `.t-tab[aria-selected=true]` | `.nav-link.active` | `nav` | `.tab.tab-active` | `[is-~=tab]` |

Copy the declarations from the kit's CSS into the tailor selectors (or `@import` the kit and alias
with `:is(.btn, .t-btn)` where the kit's own selectors can be extended). Set the kit's variables
from `--t-*` (`--bs-body-bg: var(--t-canvas)`, `--pico-background-color: var(--t-canvas)`, …) so
every palette flows through.

## Manifest example

```json
{
  "$schema": "../manifest.schema.json",
  "id": "bootstrap",
  "name": "Bootstrap 5 (Dracula look)",
  "system": "bootstrap",
  "version": "0.1.0",
  "description": "The migration skin: dracula.css + the reference set, expressed on t-* classes.",
  "coverage": ["app-shell", "navbar", "…every tier-1 id…"],
  "tier2": ["command-palette", "history-bars"],
  "palette_constraints": { "mode": "both" },
  "vendor": { "package": "bootstrap", "version": "5.3.3", "license": "MIT", "url": "https://getbootstrap.com", "vendored": true },
  "files": { "css": "skin.css", "assets": ["vendor/bootstrap.min.css"] },
  "tokens_overridden": ["--t-radius-md", "--t-radius-lg"],
  "notes": "Icons: projects using tailor typically use Bootstrap Icons in .t-icon slots; the skin does not depend on them."
}
```

## Acceptance

```
bin/verify                       # manifest + coverage + CSS parse + no palette tokens set
bin/build                        # regenerates showcase + manifest.json with your skin listed
open showcase/index.html?skin=<id>&palette=dracula   # every section, dark
open showcase/index.html?skin=<id>&palette=dracula&mode=light
open showcase/index.html?skin=<id>&palette=gruvbox
```

Screenshot the three, check: text inside cards readable, every component recognisable, zero console
errors. Then add the skin to `CHANGELOG.md`.

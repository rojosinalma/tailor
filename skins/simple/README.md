# simple

System: Simple.css 2.3.7 (simpledotcss, https://simplecss.org) · licence: MIT · vendored: **no** — translated.

## How it was built

Simple.css is classless: it styles bare elements page-wide (`body` becomes a `1fr min(45rem,90%) 1fr`
document grid, `h1` is 3 rem, every `<button>` is accent-filled, every `<td>` bordered, `<details>` is a
boxed disclosure, `mark` hardcodes `#000`). None of that can be aliased onto tailor `t-*` markup without
fighting `core/layout.css`, so the vendored file stays out (SKIN-CONTRACT rule 5) and its declarations
are re-expressed on the `t-*` selectors in `skin.css`.

Simple's twelve variables are bridged as private `--s-*` helpers so the translated rules read like the
original: `--s-bg`→`--t-canvas`, `--s-accent-bg`→`--t-inset`, `--s-text`→`--t-text`,
`--s-text-light`→`--t-muted`, `--s-border`→`--t-border`, `--s-accent`→`--t-accent-solid`,
`--s-accent-hover`→`color-mix(accent-solid 82%, text)`, `--s-accent-text`→`--t-on-accent`,
`--s-disabled`→`--t-selection`. Palettes flow through untouched; the skin never sets a palette token.

Identity, kept visibly more austere than the pico skin:

- flat: every `--t-shadow-*` is `none`; one uniform 5 px radius (`--t-radius-sm..xl`);
- 1 px solid borders on everything — cards are `<article>`s on the page background, not raised surfaces;
- one button: solid accent (`primary`); the default button is a bordered pill like Simple's nav links;
  disabled is Simple's flat `--disabled` fill, never opacity;
- tables: every cell bordered, bold accent-bg head, zebra rows;
- notices (`alert`, `toast`), `pre`, `details`-style menus and help boxes are accent-bg boxes with a
  1 px border; the tone shows as a 3 px inset bar and the icon colour, never as a translucent tint;
- labels, section titles, group headers are plain text — no small caps anywhere.

## Known gaps (approximate by design)

Simple has no tabs, badges, counters, chips, state labels, toasts, menus, sidebar, segmented control,
switch, avatar, timeline, spinner, tooltip or status colours. They are composed in Simple's idiom
(bordered pills, accent-bg boxes, accent underline for the current tab) and read as "plain", which is the
point. Shell geometry (navbar, sidebar, footer) is core's; Simple's centred document column is not used.

## Palette notes

Mode `both`. Checked dark + light on Dracula (Alucard) and Everforest dark. The only derived colour is
`--s-accent-hover` (accent-solid mixed 18 % towards text), which darkens in light palettes and lightens
in dark ones as Simple's own hover does. No palette excluded.

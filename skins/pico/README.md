# pico

System: Pico CSS 2.1.1 · licence: MIT (https://picocss.com) · vendored: no

## How it was built

Translated, not vendored: Pico's classless build styles bare elements (`dialog` as a full-screen
overlay, `details > summary` chevrons, `button { width: 100% }` in forms, `nav li` padding) and
cannot be aliased onto read-only tailor markup (SKIN-CONTRACT rule 5). `skin.css` instead:

1. Overrides the scale tokens to Pico's rhythm (single 0.25 rem radius, taller controls, 0.2 s
   ease-in-out, Pico's three-layer card shadow built from `--t-overlay-bg`).
2. Declares the full `--pico-*` variable set in `:root`, every value a `var(--t-*)` (or a
   `color-mix()` of them), so palettes flow through and projects mixing Pico variables stay
   on-palette. Component rules read the `--pico-*` names where Pico has a semantic for them.
3. Re-declares Pico's visual rules against the `t-*` selectors: solid primary buttons with
   `secondary` as the default look, box-shadow focus rings, filled form elements with the primary
   border on focus, Pico's 2 px-border checkboxes/radios and the 2.25 em switch, `article`-style
   cards/dialogs/alerts/toasts with sectioned header/footer, inverted tooltips, dropdown-surface
   menus, pill tags for badge/chip/state.

Components Pico lacks (tabs, badges, toasts, sidebar, settings rows, timeline, status dots,
segmented, pagination-as-pills) follow the patterns from a Pico reference page, written in Pico's spacing and radius.

## Known gaps (tier-1 components that look approximate)

- code-block: Pico has no token colours; the shell/JSON tokens keep the tailor hues, only the frame
  (single radius, no coloured edges) is Pico's.
- table `data-variant="log"` keeps base.css's tinted rows; Pico has only stripes.
- aria-busy spinner comes from base.css (border ring), not Pico's data-URI icon (no vendored assets).

## Palette notes (modes checked, excluded palettes and why)

Mode `both`: checked dracula dark, dracula light (Alucard) and nord dark in the showcase
(screenshots at build time). No exclusions; every colour rides `--t-*`, light palettes get Pico's
light feel for free (shadows derive from `--t-overlay-bg`, which mode-flips).

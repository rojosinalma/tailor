# govuk

System: GOV.UK Frontend 6.5.1 · licence: MIT (code) · vendored: no — translated onto `t-*` selectors.

## How it was built

Read against a GOV.UK Frontend reference page (its vendored CSS, gotchas and README), then every tier-1 component's `root`/`parts`/`attributes`/`states`
from `core/components.json` was given GOV.UK's declarations by hand:

- **Shape**: every radius 0, no shadows, 2px borders on controls (`--g-border-w`), 5px error bar
  (`--g-error-w`) on `.t-field:has([aria-invalid=true])`, 10px inset-text bar (`--g-inset-w`) on
  alerts, 5px notification-banner frame on toasts and the dialog (the timeout-warning pattern).
- **Buttons**: `govuk-button` — solid fill, 2px bottom shadow line in a darkened tone, sink 2px on
  `:active`; primary = `--t-success` (GOV.UK's default button is green), danger/warning = their
  tones; secondary = `--t-selection` grey; ghost/link = underlined link text.
- **Focus**: GOV.UK's `#ffdd00` is a literal and banned, so `--g-focus` is
  `color-mix(--t-warning 70%, --t-hue-yellow)`; focus text/shadow is `--g-ink`. Controls get the 3px
  outline + inset 2px ink shadow (`govuk-input:focus`), links/tabs the highlight block with the ink
  underline (`govuk-link:focus`), buttons turn into the focus colour (`govuk-button:focus`).
- **Ink / paper helpers**: `--g-ink` is the darkest neutral in both modes (`--t-overlay-bg` dark,
  `--t-text` light) and `--g-paper` the lightest, so the header band and the tooltip stay "dark band,
  light text" in both modes; everything else reads tokens directly.
- **Header/footer**: the ink band with the brand-colour rule drawn as an inset box-shadow (the
  `--t-nav-h` box is core and must not grow). No crown, no wordmark, no GDS Transport (system sans).
- **Tags**: badge/chip/state = `govuk-tag` (opaque 22 % tint on canvas, bold, uppercase, square);
  counter = solid ink square. Tables = `govuk-table` (no box, bold header, 1px rules); settings rows
  = `govuk-summary-list`; cards = `govuk-summary-card`; alerts = `govuk-inset-text`.

## Known gaps (approximations)

- GOV.UK has no menu, tooltip, toast, switch, segmented control, avatar, sidebar, progress bar or
  code block; they are composed in its idiom (square 2px-bordered panels, ink/paper blocks, square
  toggles). Pagination uses the brand-colour filled current item from `govuk-pagination`.
- Buttons are not `width: 100%` below the tablet breakpoint (that is a layout decision core owns).
- Secondary button shadow is a lightened grey in dark mode (a darkened one would vanish on a dark canvas).

## Palette notes

Mode `both`. Checked: `dracula` light (Alucard) and dark, `modusvivendi` (pure black canvas). GOV.UK is
light-first and GDS does not contrast-test dark; here the shapes carry the identity and every colour is
a token, so dark palettes render legibly (white 2px control borders on black, tinted tags, ink header
band with brand rule). No palette excluded.

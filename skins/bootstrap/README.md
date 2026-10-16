# bootstrap

System: Bootstrap 5.3 (Dracula look) · licence: MIT (nothing vendored) · vendored: no

The migration skin: it reproduces a Bootstrap 5 + Dracula foundation (a themed `dracula.css` plus
its reference component set) on the t-* vocabulary, so a page in this skin + the dracula palette
looks like an app built on that foundation.

## How it was built

Pure CSS translation — Bootstrap is **not** vendored. Three reasons: (1) that foundation
already overrode nearly every visible Bootstrap default, so vendoring would ship ~200 KB to then
fight it; (2) Bootstrap selects on its own classes (`.btn.btn-primary`), which contract rule 5
forbids requiring, so every declaration had to be re-stated on `.t-*[data-*]` selectors anyway;
(3) its JS components are unusable under rule 6. What survives of Bootstrap are its metrics,
re-declared here: the system font stack, 1.5 line-height, `.375rem/.75rem` control padding
(control-h 2.375rem), 4/6/8px radii, 0.15s ease-in-out transitions, `box-shadow` focus rings,
`opacity: .65` disabled buttons, the 1rem progress track, `.spinner-border` geometry, and the
`.form-check`/`.form-switch` look rebuilt with CSS masks instead of Bootstrap's background SVGs
(colour literals are forbidden, `currentColor` doesn't reach `background-image`).

Token mapping (mechanical, per the header comment in skin.css): `--drac-bg→--t-canvas`,
`bg-dark→inset`, `bg-darker→overlay-bg`, `surface→surface`, `selection→selection/border`,
`comment→disabled`, `muted→muted`, `fg→text`, `purple→accent`, `cyan→info/link`, `green→success`,
`orange→warning`, `red→danger`, hues→`--t-hue-*`; every `rgba(hue, a)` became
`color-mix(in srgb, var(--t-tone) a%, transparent)`. `--drac-on-solid` (text on solid red) is the
skin-private `--bs-on-solid`: text in dark mode, canvas in light — exactly dracula.css's values.

## Known gaps (tier-1 components that look approximate)

- relative-time: the foundation had no styling beyond plain text; kept plain + tabular digits.
- toolbar/grid/stack/split: geometry-only in core; nothing of the Dracula look to port.
- dialog `.btn-close { filter: invert(1) }` has no equivalent — the close glyph is a text ×
  coloured with tokens, which already reads correctly in both modes.

## Palette notes (modes checked, excluded palettes and why)

mode `both`. Checked headless (Chromium 1194): dracula dark, dracula light (Alucard) and gruvbox
dark — zero console errors, all tones resolve through `--t-tone`, nothing excluded. Light mode
flips `--bs-on-solid` and the tooltip inversion via `[data-mode="light"]`.

Tier-2 extras ported because the reference set already had them: drawer, command-palette
(navigation.css `.palette-*`), history-bars, mini-bars (status.css), swatch-picker
(cards-forms.css `.color-swatch`).

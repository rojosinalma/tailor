# luz skin

Renders the tailor vocabulary in the look of **@d00m-gui/luz 0.5.0** (MIT, release tarball
`github.com/d00m-gui/luz` v0.5.0). Nothing is vendored: luz's component
CSS reads generated OKLCH ramp tokens (`--primary-50…950`, `--scheme-*`, `--element-background`)
that a tailor palette does not provide, so every look was re-expressed on `t-*` selectors with
`--t-*` tokens, following `dist/luz-components.css` and the per-component sources in
`@d00m-gui/luz/dist/components/*.css`.

## Translation table

| luz | here |
|---|---|
| `--scheme` | `var(--t-tone)` |
| scheme ink `color-mix(scheme 55%, foreground)` | `color-mix(in srgb, var(--t-tone) 55%, var(--t-text))` |
| soft fill `oklch(from scheme l c h / 16%)` | `color-mix(in srgb, var(--t-tone) 16%, transparent)` |
| `--element-background` depth chain | `--luz-el` / `--luz-field`, three enumerated `:where()` nesting levels (like luz `_depth.css`), decaying `color-mix()` of `--t-text` into `--t-canvas` (5.5% → 9% → 11.5%) |
| hover `+8% foreground` | `color-mix(in srgb, <bg> 92%, var(--t-text))` |
| pressed `--state-pressed-shift` | `transform: translateY(0.1ch)` |
| `.notice` toast | `.t-toast` (scheme 18% over the element bg) |
| `.field:has(.field-affix)` boxed group | `.t-input-group` is the bordered box, children transparent |
| `.tabs.segmented` | `.t-segmented` (depth track, solid accent checked item) |
| `button.loading` braille spinner | `.t-btn[aria-busy]::before` + `@keyframes luz-loading` |

## Gotchas honoured (showcase GOTCHAS.md)

- **13** — row/table hover is `var(--t-selection)` (palette-correct), never luz's pinned
  near-black `--table-hover-bg`.
- **14** — the `.list-row` last-child end-alignment is deliberately **not** copied.
- **25** — warning (and every tone's) ink is the 55% text mix, so orange/yellow shades stay
  readable on their tinted fills.
- **19/depthSign** — depth lightens, as in the Dracula palette (`depthSign: 1`); on light palettes the
  same mix darkens slightly instead, an accepted approximation (`mode: both`).

## Known gaps

- Depth caps at 3 levels (luz caps at 4); a fourth nesting renders at level-3 colour.
- luz's OKLCH hue preservation is approximated in sRGB; very saturated palettes shift slightly.

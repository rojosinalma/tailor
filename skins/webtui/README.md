# webtui

System: WebTUI (@webtui/css) 0.1.10 · licence: MIT · vendored: **no** — translated, nothing imported

## How it was built

WebTUI's rules target attribute selectors on arbitrary elements (`is-="badge"`, `box-="square"`,
`variant-=`, `size-=`), which tailor markup cannot carry, so the relevant declarations from the bundled
build (webtui.css) were re-written onto the `t-*` vocabulary:

- **Scale**: all radii 0, shadows none, 2px borders (`--box-border-width`), monospace stack as both
  font tokens, controls 1lh tall (WebTUI `size-="small"`), `lg` = 3lh.
- **box-="square"** (border drawn half a cell inside, `padding: 1lh 1ch`) → `.t-card` and `.t-sidebar`
  via an inset `::before` frame at `z-index: -1` under `isolation: isolate`.
- **box-="double"** → `.t-dialog` as a real `6px double` border (dialogs need an opaque background, so
  the inset-pseudo trick cannot be used). Kept `position: fixed` native centring (gotcha: WebTUI's own
  dialog is `position: absolute` and lands off-screen after scrolling — not carried over).
- **button** → solid blocks, `:active` inverts to text-on-canvas, `:disabled` strikes through
  (WebTUI identity), focus = underline + outline.
- **badge** → solid tone block with canvas text (WebTUI `--badge-text: background0`); `outline`/`tint`
  variants framed/tinted.
- **checkbox / radio / switch** → `appearance: none` + glyph pseudos: `[ ]`/`[x]`/`[-]`, `( )`/`(*)`,
  4ch track + 2ch thumb switch — straight translations of `input[is-="checkbox"]`, `input[type=radio]`,
  `input[is-="switch"]`.
- **spinner** → the `variant-="dots"` braille strip panned with `steps(8)`.
- **progress** → 1lh solid bar (no glyph fill: `--progress-value-content` needs markup support).
- WebTUI's `--background0..3`, `--foreground0..2`, `--box-border-color`, `--font-family` are bridged
  from `--t-*` on `:root`, so raw WebTUI markup dropped next to tailor components picks up the palette.

Gotchas deliberately NOT inherited: `body { word-break: break-all }`, dialog `position: absolute`,
3lh default buttons, the box padding model anywhere outside card/sidebar.

## Known gaps (tier-1 components that look approximate)

- Headings keep the tailor size scale (WebTUI makes all headings one size; that would flatten the
  showcase's page hierarchy). `# `/`## `/`── ` prefixes carry the TUI flavour instead.
- Card headers sit *inside* the frame with a rule below, not punched through the top border as a
  WebTUI `shear-="top"` caption — the caption trick needs fit-content headers, tailor headers are
  full-width flex rows.
- Progress has no glyph fill and no cell-rounding (`round(…, 1ch)`), just a solid block.
- Sizes stay rem/lh-based, not a strict ch grid — tailor markup mixes text freely, a hard grid is
  unreachable without markup changes.

## Palette notes (modes checked, excluded palettes and why)

Checked dracula dark, dracula light (Alucard, `?palette=dracula&mode=light`) and gruvbox dark via
headless Chromium (Playwright 1.56.1 — `lh` unit needs Chromium ≥ 109, `steps()` everywhere). Solid
badges/buttons draw text in `--t-canvas` on the tone (WebTUI's background0-on-colour convention), so
very low tone-vs-canvas contrast palettes mute badge text; all canonical palettes pass bin/verify's
contrast gate. Mode: `both`.

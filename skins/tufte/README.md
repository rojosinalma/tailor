# tufte

System: Tufte CSS 1.9.0 (Dave Liepmann, MIT) · vendored: no — translated onto the t-* vocabulary.

## How it was built

Tufte CSS is a document stylesheet, not a component kit: it sets `body` width/padding, a 15px root,
1.4rem paragraphs, the 55 % measure on `section > p|table|ul`, sidenote counters, and nothing for
buttons, form controls, table cells, navigation or dialogs (see the skill's `assets/tufte/GOTCHAS.md`).
Nothing of it can be aliased onto tailor markup (SKIN-CONTRACT rule 5), so `skin.css` re-expresses the
look on `t-*` selectors:

- **Typography** — serif stack (`et-book`, `"ET Book"`, Palatino, Palatino Linotype, Book Antiqua,
  Georgia, serif) via `--t-font-sans`; Consolas/Liberation Mono for `--t-font-mono`; leading 1.6; all
  headings weight 400, h2/h3 italic; links inherit the ink and are underlined (thin, offset), `--t-link`
  only on hover.
- **Rules instead of boxes** — cards, lists, tables, code, alerts, timeline use 1px `--t-border`
  hairlines; the only "fill" is `--tu-faint` (5 % ink) for hover/selection; shadows off; 2px corners.
- **Controls Tufte never had** — buttons are hairline-outlined in ink (primary = double ink rule,
  inverts on hover); danger/warning/ghost-toned buttons keep the tone as text + border; inputs are
  underline-only (focus = ink underline, invalid = danger underline, disabled = dotted); the switch is an
  outlined track with an ink thumb.
- **Printed labels** — badge, chip, counter, state label, avatar: transparent with a hairline in
  `--t-tone` and italic text; `data-variant="solid"` is the ink stamp (tone fill, canvas text).
- **Tables** — italic column heads over a 1px ink rule, hairlines between rows, no zebra, no sticky
  head fill; toned rows get a 2px rule at the left instead of a wash.
- **Feedback** — alert = Tufte callout (2px tone rule at the left, body in ink); toast = slip of paper
  with a tone hairline; dialog = sheet with a hairline edge, italic title, no blur, no shadow.

Hints, captions, descriptions, timestamps, group headers are italic + `--t-muted` (sidenote flavour);
`.t-muted` itself is italic here. Nothing is uppercase or letter-spaced.

## Fonts

**No font files ship with this skin.** The et-book woff files (MIT) are not vendored here, so a page using this
skin falls back to Palatino / Book Antiqua / Georgia unless the project adds the four `@font-face`
rules from `tufte.css` itself. Palatino and Georgia are close enough that the layout does not shift
when et-book is absent; et-book has no 500 weight, which is why nothing in this skin uses `font-weight`
other than 400/700.

## Known gaps

- Sticky table heads lose their backdrop (`background: var(--t-canvas)` keeps text legible but the
  ink rule scrolls under rows).
- Tufte's sidenotes/margin notes are not a tailor component; nothing here floats into the margin.
- Dark palettes are "colour-only" Tufte (as upstream's `prefers-color-scheme: dark`): the paper feel
  is strongest on flexoki, dracula light and other light palettes.

## Palette notes

Mode `both`. Checked headless: dracula (dark), dracula light (Alucard, `?mode=light`), flexoki (dark only — the palette has no light block). No palette excluded.

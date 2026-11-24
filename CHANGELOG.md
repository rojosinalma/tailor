# Changelog

This project follows [semantic versioning](https://semver.org). Format: [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added

- HTML kit: `Tailor.busy(button, on)` marks a button busy as the React `loading` does (a spinner in place of
  its icon; it ignores clicks).
- HTML kit forms with `data-t-submit="fetch"` take an answer that is not JSON (a picture, a file): it comes in
  the `t:submit` event as `detail.blob` with `detail.response`, and a picture goes into the MediaFit that
  `data-t-result` names (`data-t-result-alt`), which a button with `data-t-download` saves. React: `Form`
  props `result`, `resultAlt`; `MediaFit` prop `id`. The tool page uses it: a project that copies it writes no
  fetch or busy code.

### Fixed

- Page checks: a control under an open popup that is not modal no longer counts as overlapped, and its hit
  area is not measured where the popup covers it.

## [2.2.0] — 2026-11-21

### Added

- Layout `tool-page` (pack `layouts`): inputs beside a result in a fill page. A form with a file picker in
  one pane, the rendered picture in the other; each pane scrolls alone and the page never scrolls. On a phone
  it is one column that scrolls as a page (see Changed). The pack `layouts` now requires `pickers`.
- `MediaFit` (core, `t-media-fit`): one image, video, canvas or SVG at the largest size that fits the free
  width and height of its box, ratio kept; `fit="contain"` also scales a small one up. An empty slot shows
  until media is put in.
- `REFERENCE.md` and the usage guide open with a table of page kinds: for each, the layout to copy, the shell
  and the Page mode.
- `tailor icons` also finds the sprite address of HTML markup (`icons.svg#bi-<name>`,
  `icons.svg#simple-icons-<name>`).
- Sample apps in the showcase, one per shell, that together use every layout: a render tool (top
  navigation), a service console (side navigation), a file editor (workspace) and sign-in, first run, error
  and offline (bare). Each shell page lists them, with stress pages: long text, names with no place to break,
  300 rows, a 6000 × 4000 and a very tall picture, and empty, loading and error states. Both kits.
- Page checks: the sample apps, also on a 2560×1440 desktop and a short 1440×800 window; rule
  `fill-body-scroll` fails a fill page wider than 40rem whose body scrolls.
- Optional props for the sample data of the layouts: `ListPageLayout` `rows`, `loading`, `error`;
  `DetailPageLayout` `service`; `ToolPageLayout` `rendering`, `error`.
- A project's `REFERENCE.md` names the packs and the shell the project has, lists the ones it can add, and
  gives the `tailor add --shell … --packs …` line.
- `ErrorPage` `detailsOpen`: the Details section starts open. The bare sample app has a stress page with it.
- Page checks: rule `clipped` (text or a control cut by a box that clips, or past the side of a pane that
  scrolls in both directions) and rule `broken-word` (a word broken in its middle, a short name broken in a
  table cell). Only the controls of an open modal dialog count for the overlap and touch rules.
- `bin/agent-check`, the agent build test: an agent builds each brief of `checks/agent/briefs/` (seven pages
  in the owner's words, both kits) from the release and its reference alone, then the page checks and a scan
  of the project's own files run on the result. Run on demand and before a release.

### Changed

- A fill page on a phone (narrower than 40rem) is one column that scrolls as a page: a `Split` in it stacks
  its panes at their natural height, so a tool page shows its inputs in full with the action under them, then
  the result; a `MediaFit` there stays within 70 % of the screen height. Before, the panes took half the
  height each and showed one label and no preview.

### Fixed

- A word breaks only when it does not fit: the page uses `overflow-wrap: break-word` (was `anywhere`), so
  a box no longer shrinks to one letter and breaks a word in its middle ("€12,48" over "0" in a stat, "Chec"
  over "k" in a stepper, a card title beside its actions). Tables keep breaking a name with no place to break.
- Table: a text cell keeps room for a short name (8ch; the row's name 12ch), so a squeezed table no longer
  breaks "web-1" at its hyphen or "nas-documents" in its middle; a header breaks between its words; a table
  narrower than 64rem has narrower cell padding. The scroll form is unchanged.
- A stat draws its value smaller in a narrow stat instead of breaking the number.
- The page body takes the focus, so the keyboard can scroll a page with nothing focusable in it (WCAG 2.1.1).
- Bare shell: an error, offline or not-found page is 32rem wide, with the shell's gutter only (it was 15rem).
- Tabs and the board columns scroll sideways only.
- A pane footer's content shrinks with the pane: a long file name wraps in it.
- Form dialog layout: the page under the button shows a table of services, not a placeholder line.
- A skeleton stops its shimmer under reduced motion.
- A relative time breaks between its words, so two time columns no longer push a table past its box.

- A split pane and a pane body hold their hidden parts: the hidden native control of a select at the end of
  a scrolled pane reached past it and made the body of a fill page scroll.
- File picker: in a narrow box the label of its button wraps instead of reaching past the drop zone.
- A state label no longer breaks inside a word in a squeezed table ("Degrade d").
- Side navigation page bar: a long title keeps its room before the description, and the bar of a readable
  page spans the whole width.
- Dashboard layout: the backup line is one text node, as in the HTML kit; on wide screens the two kits drew it
  a part of a pixel apart.

- HTML kit file picker: the choose button no longer takes the input's id (two elements had it), and the
  picker follows `aria-invalid` and `aria-describedby` of its input, and `data-invalid` of its field, after the
  start.
- Shell footers: theme controls with no layout of their own take the compact form when the footer is as
  narrow as a phone, in both kits, and go to a row of their own before the facts get narrower than a short
  line. A top navigation shell with no links showed the footer facts one letter per line on a phone.

- The release check takes the images in every palette whose page changed. At 2.1.0 it left them to the full
  run, and the side navigation images in every palette kept their 2.0.0 reference.

## [2.1.0] — 2026-11-16

### Added

- `ThemePickers` takes `layout="compact"`: one button that shows the skin and the palette and opens them in a
  popover, beside the mode button. The side navigation, the workspace sidebar and the navigation drawer use it,
  so the theme controls take one row there instead of two or three.

### Fixed

- HTML kit: a popup opened from inside another popup (a select in a popover) no longer closes the outer one,
  and Escape closes only the newest popup.
- The checks build before they check types, open a page once more after a dropped connection, confirm an
  unexpected picture with a second one, and wait for the focus in focus tests.

## [2.0.0] — 2026-11-16

Version 2 is a new framework under the same name. It shares no markup, class names or commands with
version 1, which stays on the branch `v1` and gets no new features.

### Added

- Tokens for size, spacing, colour, shape, depth and motion, and a skin model on top of them: a skin is a
  list of settings plus an extras file for looks.
- Six skins: Bootstrap, Luz, Primer, Pico, Simple, WebTUI. 21 palettes, each in dark and light, with guarded
  text colours that stay readable on every surface.
- Two kits that share the stylesheets: a React kit and an HTML kit.
- Shells: top navigation, side navigation, bare, workspace. A shell takes data and draws the frame, the
  phone form and the theme controls.
- 135 components in packs: core, forms, pickers, data, command, charts, code, markdown, chat, sortable,
  board, calendar, map, media, cropper, tour, pwa, windows, and layouts (six standard pages to copy).
- A showcase of every shell, component and layout in every skin and palette.
- The `tailor` command: `add`, `upgrade`, `remove`, `list`, `icons`.
- Checks: stylesheet and skin rules, behaviour tests that run against both kits, page checks at four widths,
  kit parity, reference images, contrast in every combination of skin, palette and mode, weight.

### Removed

- Everything of version 1: its markup, its skins as stylesheets, `tailor apply` and `tailor sync`. The skins
  daisyUI, GOV.UK and Tufte and the icon set Lucide exist in version 1 only.

# Changelog

This project follows [semantic versioning](https://semver.org). Format: [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added

- Layout `tool-page` (pack `layouts`): inputs beside a result in a fill page. A form with a file picker in
  one pane, the rendered picture in the other; each pane scrolls alone and the page never scrolls. On a phone
  the panes stack. The pack `layouts` now requires `pickers`.
- `MediaFit` (core, `t-media-fit`): one image, video, canvas or SVG at the largest size that fits the free
  width and height of its box, ratio kept; `fit="contain"` also scales a small one up. An empty slot shows
  until media is put in.
- `REFERENCE.md` and the usage guide open with a table of page kinds: for each, the layout to copy, the shell
  and the Page mode.
- `tailor icons` also finds the sprite address of HTML markup (`icons.svg#bi-<name>`,
  `icons.svg#simple-icons-<name>`).

### Fixed

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

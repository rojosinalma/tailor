# tailor — software design document

Version 2. This document says what tailor is, how it is built and which decisions shape it.
How to write a component, a shell or a skin: [authoring.md](authoring.md). The command: [cli.md](cli.md).

## 1. Purpose

Tailor is a UI framework. It gives standard shells and standard components, so that a UI built from them is
right the first time: spacing, theming, layout and behaviour, in every skin and palette, on a desktop and on
a phone. It is written for UIs that agents build: the correct result is the default result, and the rules
are checked by tools, not left to prose.

Tailor makes UIs. It does not make apps: it has no server, no data layer and no opinion on the backend. A
project picks a shell, fills it with components, and supplies its own data and pages.

## 2. The model

```
palette   the colour of every token, dark and light          core/palettes/src/<id>.json
skin      settings (fonts, corners, lines, density) + extras  core/skins/<id>/
tokens    the names everything sizes, spaces and colours with core/css/tokens.css
component written once against the tokens                     core/packs/<pack>/<id>/
shell     the frame of a UI: brand, navigation, content       core/packs/shell-<name>/
pack      a set of components a project can add               core/src/packs.ts
kit       React (behaviour from Base UI) or plain HTML        react/, html/
```

1. **Tokens** are the only names that a component, a shell or a skin sizes, spaces and colours with. A
   palette sets the colour tokens; a skin sets the skin settings; the rest is derived.
2. **A palette** is one JSON file with a dark and a light set of values. The generator turns it into a
   stylesheet and adds guarded tokens: text colours that stay readable on every surface (4.5:1), control
   lines and the focus ring that stay visible (3:1). A value moves only where the palette's own value is
   below the floor, and it keeps its hue.
3. **A skin** is a list of settings plus an extras file. Settings give values to tokens: fonts, text sizes,
   corners, line widths, shadows, the spacing unit, control heights, motion. The extras file holds looks that
   no setting covers and may only use look properties, never size, spacing or position. So a component is
   written once and works in every skin, and a new component costs no work per skin.
4. **A component** has a spec (names and allowed values), one stylesheet, a React component, examples, and
   where it has behaviour an HTML kit script and behaviour tests. The React component is the source: the
   build renders its examples in a static mode to make the HTML kit's pages and reference markup.
5. **Two kits** share the stylesheets and produce the same classes, parts and state attributes. The React
   kit builds behaviour on Base UI and runs in the browser against any backend. The HTML kit is plain markup
   plus a small script with no dependencies; a project needs no build tool to use it. One set of behaviour
   tests runs against both.
6. **A shell** takes data (brand, navigation items, actions, footer facts), not markup, and draws the frame:
   the current link, the phone form, the theme controls. The frame is bound to the visible screen; the page
   inside scrolls, or in fill mode only its panes do.
7. **A pack** controls which files a project gets and which libraries it installs. `core` holds what nearly
   every UI uses. A library always means a pack of its own.
8. **The theme** is three attributes on `<html>`: `data-skin`, `data-palette`, `data-mode`. They change at
   run time and the markup stays the same. The choice is kept across visits, and a script in `<head>` applies
   it before the first paint.

## 3. Repository

```
core/      tokens and shared stylesheets (css/), packs (packs/), skins, palettes, framework-free logic (src/)
react/     the React kit: src/<pack>/<component>/
html/      the HTML kit: the runtime and src/<pack>/<component>.ts
cli/       the tailor command
showcase/  the showcase site: every shell, component and layout, in every skin and palette
checks/    behaviour tests, page checks, image check, contrast check, weight check
bin/       build, check, and their libraries
docs/      this document, the authoring guide, the command, usage
```

`bin/build` makes `dist/`: the stylesheets, the HTML kit scripts, the manifest, the showcase site, and with
`--release` the release artifact. `bin/check` runs the checks (section 6).

## 4. Contracts

A change to one of these is a breaking change: it needs a new major version, an entry in
`docs/breaking.json` with its steps, and a rewrite script where one is possible.

1. The token names in `core/css/tokens.css`.
2. Class names, part names, variant attributes and state attributes of every component (its spec).
3. The props of every React component.
4. The markup that the HTML kit starts from, and the names of its behaviours (`data-t`).
5. The data contract of the shells.
6. The theme protocol: the three attributes, the storage keys, the `t:theme` event, `window.TAILOR_THEME`.
7. The layout of the release artifact, `manifest.json` and the state file `tailor.json`.
8. The commands and options of `tailor`.

## 5. Vendoring

A project carries its own copy of tailor's files and may edit it. Tailor does not track, list or inspect
projects. The `tailor` command works on one folder and keeps its state in that folder (`tailor.json`: the
version, the kit, the shell, the packs and a hash of each file). An upgrade runs for one project, on
request: it shows a preview first, never overwrites a file the project edited, and reports what it kept. A
release is a tagged build; the command takes it from a download or from a local build of the same version.

## 6. Checks

Every rule that matters is a check in this repository. They run on tailor's own code and showcase.

| Check            | What fails it                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Types            | A value outside a component's allowed values; any type error (strict TypeScript)                                                                             |
| Lint and format  | Biome                                                                                                                                                        |
| Stylesheet rules | A raw size, colour or duration in a component; an unknown token; a class without the `t-` prefix                                                             |
| Skin rules       | A setting that is not a setting; an extras rule that sets size, spacing or position                                                                          |
| Unit tests       | Shared logic: palettes and contrast, dates, positions, pack rules, the command                                                                               |
| Completeness     | A component without a spec, a React component, a showcase entry, or the script and tests its spec asks for                                                   |
| Behaviour        | One test set per component with behaviour, run against both kits                                                                                             |
| Pages            | Each showcase page, in each skin, at 390, 820, 1440 and 1920 px: sideways scroll, cut text, overlapping controls, touch size, WCAG 2.2 AA rules, page errors |
| Kit parity       | The HTML kit and the React kit draw a page differently                                                                                                       |
| Images           | A page looks different from its reference image                                                                                                              |
| Contrast         | Text below 4.5:1 in any of the 252 combinations of skin, palette and mode                                                                                    |
| Weight           | The HTML core above 50 kB compressed                                                                                                                         |
| Unused code      | Files and dependencies that nothing uses                                                                                                                     |

`bin/check` runs what the changed files touch, in seconds. `bin/check --release` runs everything and takes
an image again only when something that draws it changed. `bin/check --full` takes every image again and
checks contrast for every component.

Reference images are stored as hashes of their pixels (`checks/images.json`); the image files themselves
stay on the machine that ran the check.

## 7. Configuration surface

1. A project's theme: the storage key, the default skin, palette and mode (`tailor add`, stored in
   `tailor.json`, written into `head.html`).
2. Built-in texts: `setTexts()` replaces any of them (`core/src/text.ts`).
3. Environment of the tools: `TAILOR_RELEASES` (the local release store), `TAILOR_BROWSER_PORT` (the port of
   the checks' browser).

## 8. Scope

1. Browsers: the current versions of Chrome, Safari and Firefox, on desktop and phone.
2. Accessibility: WCAG 2.2 level AA.
3. Texts are English; a project replaces them to translate. Right-to-left layouts are not covered.
4. Six skins and 21 palettes, each palette in dark and light. Every skin works with every palette.
5. Two icon sets: Bootstrap Icons and Simple Icons, delivered as one sprite per project.

## 9. Design decisions

Append-only. One line per decision: what, why.

1. 2026-11-15 — A skin is settings plus extras, not a hand-written stylesheet. A component is then written once; hand-written skins set spacing in many places, each in its own way.
2. 2026-11-15 — The React component is the source; the HTML kit's pages come from its static render. Two sources drift.
3. 2026-11-15 — The React kit builds on Base UI; the HTML kit on browser built-ins (`<dialog>`, popover) and its own small script. The HTML kit must work with no build tool and little script.
4. 2026-11-15 — No native select or picker shows in either kit; the native control stays underneath as the value holder and the fallback. One look on every device.
5. 2026-11-15 — The React kit requires TanStack Router: a shell must know the current page. It wraps Table, Virtual, Form, Query, Hotkeys and Pacer where a component needs them; Store, DB, Start and Devtools are out, because they are not UI.
6. 2026-11-15 — Packs: a new library means a new pack. A project then carries no code it does not use.
7. 2026-11-15 — The HTML core stays under 50 kB compressed.
8. 2026-11-15 — A shell takes data, not markup. Frames written by hand differ from project to project.
9. 2026-11-15 — The frame is bound to the screen and only the content scrolls; a page is in scroll mode or fill mode. Wanted behaviour for app-like UIs; fill mode gives views that never scroll as a page.
10. 2026-11-15 — A component adapts to its container, a shell to the screen. A table in a narrow panel on a wide screen must take its narrow form.
11. 2026-11-15 — Controls are 44 px high on touch screens; popups are bottom sheets on a phone; a form dialog takes the full phone screen.
12. 2026-11-15 — A project's copy of tailor may be edited; an upgrade never overwrites an edited file. The project owns its copy.
13. 2026-11-15 — Tailor ships no checks into projects and reads no project, except to find icon names for the sprite. Responsibilities stay separate.
14. 2026-11-15 — Checks run by scope: what changed, a release, a full run. A slow check gets skipped.
15. 2026-11-15 — CSS is minified by removing comments and white space only. A minifier that rewrites selectors changed `:not(a, b)` into a form that one browser does not know.
16. 2026-11-15 — The palette generator guards contrast and keeps the hue. Many palettes put coloured text below 4.5:1 on raised or sunken surfaces; a per-component fix would have to be repeated everywhere.
17. 2026-11-15 — Tints: 5% of a tone behind normal text, up to 20% behind text in that tone. Measured over all palettes.
18. 2026-11-16 — Reference images are pixel hashes in the repository and files on the checking machine. Thousands of image files do not belong in the history.
19. 2026-11-16 — The image check paints the whole page again before each image and hashes pixels, not file bytes. The browser repaints only part of a page after a change, and compresses the same pixels to different bytes.
20. 2026-11-16 — The touch check probes the real hit area. A label, a field box or an extended area around a small icon is the target, not the icon's own box.
21. 2026-11-16 — In the HTML kit a pack's script bundles its library; in the React kit the project installs it. An HTML project has no package manager.
22. 2026-11-16 — The side navigation shell has no top bar on a desktop: the page header is the top bar of the content region. One bar, not two.
23. 2026-11-16 — Charts take categories as text; there is no time axis. A time axis needs a date library.
24. 2026-11-16 — Tokyo Night light text and Solarized light sunken surface moved slightly (to #3358b0 and #f1ebd8). Text on the sunken surface was below 4.5:1.

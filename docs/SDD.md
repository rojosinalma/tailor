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

| Check            | What fails it                                                                                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types            | A value outside a component's allowed values; any type error (strict TypeScript)                                                                                                                                                                               |
| Lint and format  | Biome                                                                                                                                                                                                                                                          |
| Stylesheet rules | A raw size, colour or duration in a component; an unknown token; a class without the `t-` prefix                                                                                                                                                               |
| Skin rules       | A setting that is not a setting; an extras rule that sets size, spacing or position                                                                                                                                                                            |
| Unit tests       | Shared logic: palettes and contrast, dates, positions, pack rules, the command                                                                                                                                                                                 |
| Completeness     | A component without a spec, a React component, a showcase entry, or the script and tests its spec asks for                                                                                                                                                     |
| Behaviour        | One test set per component with behaviour, run against both kits                                                                                                                                                                                               |
| Pages            | Each showcase page, in each skin, on five screens (phone 390 px, tablet upright 820 px and on its side 1180 px, all three by touch; desktops at 1440 and 1920 px): sideways scroll, cut text, overlapping controls, touch size, WCAG 2.2 AA rules, page errors |
| Kit parity       | The HTML kit and the React kit draw a page differently                                                                                                                                                                                                         |
| Images           | A page looks different from its reference image                                                                                                                                                                                                                |
| Contrast         | Text below 4.5:1 in any of the 252 combinations of skin, palette and mode                                                                                                                                                                                      |
| Weight           | The HTML core above 50 kB compressed; the React core above 162.5 kB compressed                                                                                                                                                                                 |
| Unused code      | Files and dependencies that nothing uses                                                                                                                                                                                                                       |

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
25. 2026-11-16 — Proof of the two-kit model: select, date picker and dialog passed one shared behaviour test set in both kits (44 tests) before any other component was written.
26. 2026-11-16 — Proof of the image check: 371 page states with images took 3.5 s on 14 pages; about 130 ms per state for one worker, so a full run of some 5,000 states fits the two-minute limit with 24 workers.
27. 2026-11-16 — The standard page layouts are a pack (`layouts`) that requires `core`, `forms` and `data`. A layout uses components of those packs, and a pack is how a project gets files.
28. 2026-11-16 — Behaviour tests run with the real clock; a test that reads "today" holds the date itself. A date that stands still for the whole page breaks timing inside Base UI.
29. 2026-11-16 — A tablet is checked upright (820×1180) and on its side (1180×820), both as a touch screen; the showcase has both sizes. On its side a tablet is as wide as a small desktop but is used by touch, so it gets the desktop layout with touch sizes, and that pair needs its own check.
30. 2026-11-16 — Two images count as the same when they differ only by drawing noise: at most 150 pixels, at most 40 of them by more than 6 colour levels. The browser draws the edge of a rounded corner or of a small icon a little differently from run to run; the accepted pictures are kept on the checking machine for this comparison.
31. 2026-11-16 — The React core limit is 162.5 kB compressed: the first measured build of the whole core pack with React, Base UI and the router (147.6 kB) plus 10 %. The HTML core measured 37.6 kB of its 50 kB.
32. 2026-11-16 — A release check leaves out the 1920 px screen and the images in every palette; the full run takes them. Measured on a quiet machine: a release check takes about 95 s (limit 120 s), a full run about 6 minutes.
33. 2026-11-16 — The image check loads a page again for each skin and switches palettes in place. A skin changes sizes, and a component that measures itself is only right after a load in that skin.
34. 2026-11-16 — A behaviour test that fails runs once more alone before it counts as failed. With two dozen pages open at once, a wait can run out of time.
35. 2026-11-16 — Contrast was checked for every component in all 252 combinations of skin, palette and mode: 34,020 combinations, 0 problems.
36. 2026-11-16 — The showcase is itself an installable app (the pwa pack, used on itself), with its own check against a real server (`showcase/check-pwa.ts`). The first version of the service worker passed its tests and never finished an install in real use: the tests answered its requests from memory. A worker test must use the real network path.
37. 2026-11-16 — An installed app behind an access proxy (a proxy that sends every request without a session to a sign-in page on another origin, such as Cloudflare Access) was tested against a stand-in proxy: with a session the app installs; when the session is gone and the device is online, a navigation goes to the sign-in page; offline, the stored app opens; nothing of the sign-in page ever enters the cache. Limit: the test with the real proxy and a signed-in browser needs a person, so it was not run. A first install always needs a session.
38. 2026-11-16 — The unused-code check also fails on an export or a type that nothing uses. Four were left at the release; they are gone.
39. 2026-11-16 — The check builds before it checks types. On a fresh checkout the generated files of the showcase did not exist yet; the first nightly run and the first CI run found it.

## 10. Measurements at 2.0.0

Measured on the development machine (32 cores) with a warm image cache, unless a line says otherwise.

### Weight (compressed)

| What a page loads                                                                            | Size     | Limit    |
| -------------------------------------------------------------------------------------------- | -------- | -------- |
| HTML core: `tailor.css` 17.3 kB + one skin 2.3 kB + one palette 0.7 kB + `tailor.js` 17.2 kB | 37.6 kB  | 50 kB    |
| React core: every component of the core pack with React, Base UI and the router              | 147.6 kB | 162.5 kB |

| Pack                                                                              | Stylesheet              | HTML kit script                       |
| --------------------------------------------------------------------------------- | ----------------------- | ------------------------------------- |
| forms                                                                             | 1.6 kB                  | 8.2 kB                                |
| pickers                                                                           | 2.7 kB                  | 11.9 kB                               |
| data                                                                              | 2.3 kB                  | 9.4 kB                                |
| charts                                                                            | 1.0 kB                  | 68.4 kB (Chart.js)                    |
| code                                                                              | 1.9 kB                  | 26.3 kB (highlight.js, 16 languages)  |
| markdown                                                                          | 0.8 kB                  | 28.4 kB (marked, DOMPurify)           |
| map                                                                               | 3.9 kB (with Leaflet's) | 47.9 kB (Leaflet)                     |
| media                                                                             | 2.2 kB                  | 3.3 kB                                |
| pwa                                                                               | none                    | 3.6 kB, and the service worker 1.4 kB |
| layouts                                                                           | none                    | 0.7 kB                                |
| shells: topnav, sidenav, bare, workspace                                          | 0.4, 1.4, 0.4, 1.8 kB   | 1.0, 1.7, none, 3.8 kB                |
| command, chat, sortable, board, calendar, tour, cropper, windows (React kit only) | 0.6 to 2.3 kB each      | none                                  |

### Time

| Check                                                                                             | Time  | Limit       |
| ------------------------------------------------------------------------------------------------- | ----- | ----------- |
| A change to one component (`bin/check`)                                                           | 4 s   | 10 s        |
| A release (`bin/check --release`): 6,048 page states, 5,544 contrast combinations                 | 94 s  | 120 s       |
| A release on a machine with no image cache                                                        | 196 s | not limited |
| A full run (`bin/check --full`): 8,462 page states with every image, 34,020 contrast combinations | 335 s | not limited |

The three slowest steps of a release: pages and images 45 s, contrast 24 s, behaviour in both kits 22 s
(1,084 tests). The release check keeps 22 % of its limit.

### Known limits

1. A change that touches many components at once (a dozen and more) takes longer than 10 s: the change
   check takes fresh images of every page of each of them.
2. The two kits are compared with a small tolerance for drawing noise (decision 30), not pixel for pixel.
3. The installed app behind an access proxy was tested against a stand-in, not with a signed-in browser
   (decision 37).
4. Right-to-left layouts are not covered. Texts are English until a project replaces them.
5. In the HTML kit a pack gives what its row in `tailor list` says: the packs command, chat, sortable, board,
   calendar, tour, cropper and windows are React only.

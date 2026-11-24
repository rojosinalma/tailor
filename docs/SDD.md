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

| Check            | What fails it                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types            | A value outside a component's allowed values; any type error (strict TypeScript)                                                                                                                                                                                                                                                                                                                                                                              |
| Lint and format  | Biome                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Stylesheet rules | A raw size, colour or duration in a component; an unknown token; a class without the `t-` prefix                                                                                                                                                                                                                                                                                                                                                              |
| Skin rules       | A setting that is not a setting; an extras rule that sets size, spacing or position                                                                                                                                                                                                                                                                                                                                                                           |
| Unit tests       | Shared logic: palettes and contrast, dates, positions, pack rules, the command                                                                                                                                                                                                                                                                                                                                                                                |
| Completeness     | A component without a spec, a React component, a showcase entry, or the script and tests its spec asks for                                                                                                                                                                                                                                                                                                                                                    |
| Behaviour        | One test set per component with behaviour, run against both kits                                                                                                                                                                                                                                                                                                                                                                                              |
| Pages            | Each showcase page, in each skin, on five screens (phone 390 px, tablet upright 820 px and on its side 1180 px, all three by touch; desktops at 1440 and 1920 px), and the pages of the sample apps also on a 2560×1440 desktop and a short 1440×800 window: sideways scroll, cut text, content cut by a box around it, a short name broken in a table cell, overlapping controls, touch size, a fill page whose body scrolls, WCAG 2.2 AA rules, page errors |
| Kit parity       | The HTML kit and the React kit draw a page differently                                                                                                                                                                                                                                                                                                                                                                                                        |
| Images           | A page looks different from its reference image                                                                                                                                                                                                                                                                                                                                                                                                               |
| Contrast         | Text below 4.5:1 in any of the 252 combinations of skin, palette and mode                                                                                                                                                                                                                                                                                                                                                                                     |
| Weight           | The HTML core above 50 kB compressed; the React core above 162.5 kB compressed                                                                                                                                                                                                                                                                                                                                                                                |
| Unused code      | Files and dependencies that nothing uses                                                                                                                                                                                                                                                                                                                                                                                                                      |

The sample apps (`showcase/src/demo/`, one per shell, every layout of the layouts pack at least once) hold
realistic and hostile content: their stress pages have long text, names with no place to break, 300 rows,
pictures larger and taller than the screen, and empty, loading and error states. A release takes the sample
pages in every skin on the phone and the 1440 px desktop and in the default skin on the other screens, and the
stress pages in the default skin; a full run takes them all (`checks/src/apps.ts`).

The agent build test (`bin/agent-check`) checks what an agent does with tailor, not what tailor can do. For
each brief in `checks/agent/briefs/` (a page in the owner's words, with its kit) it makes a project of its own
in `.agents/tmp/agent-check/`, adds this checkout's release to it, and has an agent build the page from the
vendored files and the reference only: no skills, no tools from outside the project, no hints. Then the page
checks above run on the result (two skins, both modes, the phone, the upright tablet, a short desktop window
and the large desktop, and every dialog that the brief names, open), and the project's own files are read for
colours and sizes of their own and for rules that restyle tailor's parts. A failure is a fault of tailor (a
missing part or layout, a reference line that is missing or unclear), of the brief or of the runner; tailor's
faults are fixed in tailor, never by an easier brief. An agent decides differently each time, so the test is
slow and not repeatable: it is not part of `bin/check`, and it runs on demand and before a release.

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
32. 2026-11-16 — A release check leaves out the 1920 px screen and the images in every palette (palette part superseded by decision 43); the full run takes them. Measured on a quiet machine: a release check takes about 95 s (limit 120 s), a full run about 6 minutes.
33. 2026-11-16 — The image check loads a page again for each skin and switches palettes in place. A skin changes sizes, and a component that measures itself is only right after a load in that skin.
34. 2026-11-16 — A behaviour test that fails runs once more alone before it counts as failed. With two dozen pages open at once, a wait can run out of time.
35. 2026-11-16 — Contrast was checked for every component in all 252 combinations of skin, palette and mode: 34,020 combinations, 0 problems.
36. 2026-11-16 — The showcase is itself an installable app (the pwa pack, used on itself), with its own check against a real server (`showcase/check-pwa.ts`). The first version of the service worker passed its tests and never finished an install in real use: the tests answered its requests from memory. A worker test must use the real network path.
37. 2026-11-16 — An installed app behind an access proxy (a proxy that sends every request without a session to a sign-in page on another origin, such as Cloudflare Access) was tested against a stand-in proxy: with a session the app installs; when the session is gone and the device is online, a navigation goes to the sign-in page; offline, the stored app opens; nothing of the sign-in page ever enters the cache. Limit: the test with the real proxy and a signed-in browser needs a person, so it was not run. A first install always needs a session.
38. 2026-11-16 — The unused-code check also fails on an export or a type that nothing uses. Four were left at the release; they are gone.
39. 2026-11-16 — The check builds before it checks types. On a fresh checkout the generated files of the showcase did not exist yet; the first nightly run and the first CI run found it.
40. 2026-11-16 — A page that failed to load because the machine's network changed is opened once more. The checks' browser shares the machine's network, and a container that starts elsewhere makes it drop its requests.
41. 2026-11-16 — A picture that is not the expected one is confirmed by more pictures, a moment apart, until two in a row are the same. On a busy machine the browser hands out a picture that still shows parts of an older frame (the area of the first screen, without the icons that arrived later); a picture taken a moment later is right. Found on the first CI runs.
42. 2026-11-16 — A behaviour test waits for the focus, it does not read it once. Base UI moves the focus a frame after a key; a slow machine showed the tests that read too early.
43. 2026-11-20 — A release check takes an image in every palette when its fingerprint is not known, and reads a known one from the page of the same skin without a visit. At 2.1.0 the theme controls changed the side navigation in every palette, the release check did not take those images, and the nightly full run found 41 changed images. The release check still takes about 95 s. Supersedes the palette part of decision 32.
44. 2026-11-20 — The layouts pack has a tool page (inputs beside a result) and requires the pickers pack for its file picker. The first project on version 2 built a tool page as a scroll page with cards, and a rendered picture grew the page past the screen: no layout fitted it.
45. 2026-11-20 — `MediaFit` (core) fits one picture to the free width and height of its box and never draws it above its natural size unless asked. A picture in a pane or a card took its natural height and grew its parent. In a box with no fixed height it fits the width only, so it never breaks a scroll page.
46. 2026-11-20 — A tool page on a phone keeps the fill mode: the split stacks its two panes, each with half the height, each scrolling alone, as a split and a fill page already did. One rule for fill pages on every screen; a page that scrolls on a phone only would need a second rule and a second check.
47. 2026-11-20 — The reference opens with a table of page kinds (layout, shell, page mode). An agent that reads the components first picks parts and guesses the page; the table makes it pick the page first.
48. 2026-11-20 — A shell footer that leaves its theme controls without a layout measures itself and takes the compact ones when it is as narrow as a phone; the facts keep a short line before the controls go to a row of their own. A top navigation shell with no links has no drawer, so its footer stays on a phone, and the full controls left the facts one letter per line.
49. 2026-11-20 — `tailor icons` also reads the sprite address that HTML markup writes (`icons.svg#bi-<name>`). An HTML project writes that form, not `bi:<name>`, and got a sprite without its icons. Only addresses with `icons.svg` count, so a page anchor such as `#bi-weekly` is not an icon.
50. 2026-11-21 — A fill page on a phone (a page narrower than 40rem) is one column that scrolls as a page: its body scrolls, a row `Split` in it stacks its panes at their natural height, and a `MediaFit` in that split stays within 70 % of the screen height. A part that keeps its own height (a list and detail, a log, one `Pane`) still scrolls alone. The rule belongs to the page and the split, not to the tool page: every fill page with a split gets it. On wider pages a fill page never scrolls. Supersedes decision 46: two stacked halves left the settings one label high and the preview empty on a phone.
51. 2026-11-21 — The page check fails a fill page wider than 40rem whose body holds more than it shows (rule `fill-body-scroll`). It is measured by the width of the page, as the phone rule is, not by the screen. It found a fault at once: the hidden native control of a select at the end of a scrolled pane reached past the pane and made the tool page's body scroll.
52. 2026-11-21 — The showcase has four sample apps, one per shell, that together use every layout: a render tool (top navigation), a service console (side navigation), a file editor (workspace) and the pages before and outside an app (bare). Each has stress pages with hostile content and empty, loading and error states. The page checks open them in both kits. Short, polite showcase content and screens up to 1920 px never showed the fault of the first real project.
53. 2026-11-21 — The sample apps also take a 2560×1440 desktop and a short 1440×800 window; the component pages do not. A release takes the sample pages in every skin on the phone and the 1440 px desktop and in the default skin on the other screens, and the stress pages in the default skin on the release screens; a full run takes everything. This keeps the release check near 107 s, under its limit of 120 s.
54. 2026-11-21 — A scroll box of a part (a split pane, a pane body) holds its hidden parts, as the page body does (`position: relative`). Otherwise a visually hidden control at its end reaches past it and grows the box around it.
55. 2026-11-21 — A state label breaks between its words, and inside a word only when the word does not fit (`overflow-wrap: break-word`). Next to a long name with no place to break, a table squeezed the status column to "Degrade d" in the table and list page examples.
56. 2026-11-21 — In the side navigation's page bar the title keeps its room and the description gives way first; a readable page keeps the whole bar and only its content stops at the readable width. A long name was cut to its first letters while the description kept its room, and the bar of a readable page stopped in the middle of a wide screen.
57. 2026-11-21 — A React example writes one text node where the HTML kit's markup has one (`{`, ${size}`}`, not `, {size}`). Two text nodes draw a part of a pixel apart, and on the wide screens the two kits' pictures differed.
58. 2026-11-21 — The button of the file picker wraps its label in a narrow box. In the phone example of the tool page on a 1920 px screen it reached past its drop zone and was cut at "Choose a fi"; no page rule saw it, because the pane around it scrolls sideways.
59. 2026-11-21 — Page rule `clipped`: text or a control that reaches past the edge of a box that clips (overflow hidden or clip, with no ellipsis or line clamp), or past the side of a box that scrolls in both directions (a pane, a page region), unless it is preformatted text (code, a log). A box that scrolls sideways by design says so with `overflow-y: hidden` (`overflow: auto hidden`): the tab strip and the board columns now do. The walk stops at the nearest box that scrolls. The fault of decision 58 was only visible in a picture; the rule finds it, and on its first run it found a table squeezed past its box in the monospaced skin.
60. 2026-11-21 — Page rule `broken-word`: a word breaks only after a hyphen, a dot, a slash or a low line, never in the middle; in a table cell a word of at most 8 characters stays whole. A word longer than 16 characters (a path, an address, a name with no place to break) and, outside a table, a word wider than the whole line of its box may break anywhere. It is measured per character in the page.
61. 2026-11-21 — The page breaks a long word only when it does not fit (`overflow-wrap: break-word` on the body, was `anywhere`); a table keeps `anywhere` in its cells, a text cell keeps room for a short name (8ch, the row's name 12ch), a header breaks between its words, and a table narrower than 64rem has narrower cell padding. `anywhere` let every box shrink to one letter: "Degrade d", "nas-document s" and "€12,48 0" in pages that agents built.
62. 2026-11-21 — A stat draws its value smaller in a narrow stat (`min(3xl, 20cqi)`) instead of breaking the number; a card title keeps 8rem beside the card's actions; a stepper step gives way down to its longest word; what a pane footer holds shrinks with the pane.
63. 2026-11-21 — The page body takes the focus (`tabindex="0"`, a region named by the page title). It is the box that scrolls, and with nothing focusable in it (a table of text) the keyboard could not scroll it (WCAG 2.1.1, axe `scrollable-region-focusable`); found when the form dialog layout got a table under its button.
64. 2026-11-21 — In the bare shell a standard page (error, offline, not found) takes the width it is made for (32rem) and the shell's gutter is its own. With both gutters an error page in the middle of a desktop was 15rem wide, which the error page with its details open showed.
65. 2026-11-21 — The agent build test (`bin/agent-check`, section 6): an agent builds each brief from the vendored files and the reference alone, in a project of its own with no skills and no tools from outside it, and the page checks and a scan of the project's own files run on its result. It is the test of the core objective (an agent builds, the owner corrects nothing) that the showcase cannot be: the showcase proves that tailor can make a good page, the briefs that an agent does. Not part of `bin/check`: an agent decides differently each run.
66. 2026-11-21 — The page rules count only the controls of an open modal dialog: the page under it takes no input. The agent build test opens the dialogs that a brief names, which no showcase check did.
67. 2026-11-21 — A project's `REFERENCE.md` says which packs and shell the project has, lists what it can add, and gives the `tailor add --shell … --packs …` line, before "How to use". An agent in a project with only the core pack built a shell and a settings page by hand from core parts: the page-kind table named layouts and shells that it did not have, and nothing said how to get them.
68. 2026-11-21 — A relative time ("24 minutes ago") breaks between its words. Two such columns that never wrapped pushed an agent's table of backup jobs past its box on the tablet.
69. 2026-11-21 — A skeleton has no animation under reduced motion. A zero-length animation that repeats forever drew another moment of the shimmer in each picture, and the full run failed on the loading page of the sample console in a different screen each time.
70. 2026-11-24 — The page rules do not count a control under an open popup that is not modal (a popover, a menu, a list, a dialog opened without `showModal`) as overlapped, and do not measure its hit area where the popup covers it; the popup's own controls still count among themselves. A popup lies over the page by design: on a settings page with open help popovers the inspector reported 622 overlaps that were not faults.

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

| Check                                                                                              | Time  | Limit       |
| -------------------------------------------------------------------------------------------------- | ----- | ----------- |
| A change to one component (`bin/check`)                                                            | 4 s   | 10 s        |
| A release (`bin/check --release`): 7,606 page states, 5,544 contrast combinations                  | 109 s | 120 s       |
| A release on a machine with no image cache                                                         | 280 s | not limited |
| A full run (`bin/check --full`): 10,934 page states with every image, 34,524 contrast combinations | 426 s | not limited |

The three slowest steps of a release: pages and images 58 s (the sample apps take 9 s of it), contrast 24 s,
behaviour in both kits 22 s. The release check keeps about 11 % of its limit; on a busy machine it can pass
the limit.

### Known limits

1. A change that touches many components at once (a dozen and more) takes longer than 10 s: the change
   check takes fresh images of every page of each of them.
2. The two kits are compared with a small tolerance for drawing noise (decision 30), not pixel for pixel.
3. The installed app behind an access proxy was tested against a stand-in, not with a signed-in browser
   (decision 37).
4. Right-to-left layouts are not covered. Texts are English until a project replaces them.
5. In the HTML kit a pack gives what its row in `tailor list` says: the packs command, chat, sortable, board,
   calendar, tour, cropper and windows are React only.

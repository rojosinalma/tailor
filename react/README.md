# tailor-react

The React adapter for tailor: the `Ui.*` component API over the tailor
markup vocabulary (`core/components.json`). Workspace-local, consumed as
source — **not published**.

```tsx
import { Ui, UiProvider, useToasts, useConfirm } from "tailor-react";

<UiProvider>
  <Ui.Button tone="danger" variant="ghost">Delete</Ui.Button>
  <Ui.Field label="Hostname" hint="The LAN name."><Ui.Input /></Ui.Field>
</UiProvider>
```

## Render path

Every component in `src/` renders *exactly* the tailor
   markup: same `t-*` classes, data-attributes and aria states as
   `core/components.json`, so every tailor skin × palette works unchanged. Load
   the CSS per `core/conventions.md` §1 (tokens → base → layout → skin →
   palette; see `demo/src/main.tsx`). **Do not load `core/tailor.js`** — the
   behaviours are reimplemented as React state with controlled/uncontrolled
   props: tabs, menus (one popup at a time, flip/align, item click closes,
   checkbox items toggle), listbox, dialogs (`data-dialog-close` buttons),
   toasts, tooltips, help popovers, copy, truncate, dismiss, filters, drawn
   select, number steppers, duration, settings autosave, form validation,
   sortable tables, relative time. Not reimplemented: `Tailor.scrollspy` and
   the tier-2 pickers (files, dates, clocks, colours). `Tailor.theme` has a
   React twin, `useTailorTheme` + `<Ui.Pickers>` (see Theme switcher); the
   pre-paint script still writes the links before the first paint. After
   mount the DOM is the one `Tailor.upgrade` leaves on the same HTML (same
   drawn parts, ids, aria links, strings and `data-t-*` markers), so a page
   that also loads `tailor.js` never wires a React node twice.

One React kit only: tailor-react renders tailor markup, so the skin and palette give it its
look. There is no component-kit adapter (the Primer adapter was removed in 0.10.0; the `primer`
skin gives the Primer look instead).

## Drawn controls (two-phase render)

The server render and the first client render emit the canonical markup of
`core/components.json` — a plain `<select class="t-select">`, a bare
`<input type="number">`, a help button without `aria-controls`. After mount
each component adds what `tailor.js` draws at upgrade, in the same place:

| Component | Added after mount |
|---|---|
| `Ui.Select` (not `multiple`, not `data-native`) | `span.t-select-wrap` around the hidden native select (`tabindex=-1`, `aria-hidden`), `button.t-select.t-select-btn` (copies `data-size`, `data-tip`, `aria-label`, `aria-invalid`; `aria-labelledby` the `<label for>`), `ul.t-menu-list.t-select-list[role=listbox]` |
| `Ui.Input type="number"` (not `data-steppers="none"`) | `.t-number` on the enclosing `Ui.InputGroup` (else a new `.t-input-group.t-number`), − / + `button.t-number-step` (hold to repeat, disabled at min/max) |
| `Ui.DurationInput` | the steppers and the drawn unit select |
| `Ui.Help` | `aria-controls` + box id |
| `Ui.Truncate expand` | `tabindex="0"`, `role="button"` (Enter / Space toggle) |
| `Ui.Footer.Pickers` | `.t-pickers` and its controls (`Ui.Pickers` parts) |
| wired roots | the `data-t-*` marker `Tailor.upgrade` sets (`data-t-menu`, `data-t-tabs`, …) |

Why two phases: no hydration mismatch (server and first client pass are the
same markup), and `bin/check-parity` stays a strict contract check: it
compares that first pass, structurally, with the canonical snippet (43/43). The
drawn parts are checked in the browser instead: the showcase comparison
(`?kit=tailor` vs `?kit=react`) diffs the mounted React DOM against the
upgraded HTML DOM. The drawn parts drive the native control (`input` + `change`
events through the native value setter), so React `onChange` handlers and
`<form>` submission keep working on the native element.

## Components and props added in 0.10.0

- `Ui.Form validate="live" nativeValidation onInvalidSubmit` — the React
  `Tailor.forms`: `novalidate`, on submit every control runs `checkValidity()`;
  invalid ones get `aria-invalid` and their `validationMessage` as the
  `.t-feedback[data-tone=danger]` of their `Ui.Field` (linked with
  `aria-describedby`), the first one takes focus and `onSubmit` is not called.
  Input clears a fixed control; `validate="live"` also checks on blur.
- `Ui.Settings save` — autosave for every row (`Tailor.settingsAutoSave(root,
  save)`); `Ui.SettingsRow save` still works per row. A save sets
  `data-state="saving|saved|failed"`, toasts the result message ("Saved" /
  "Save failed" by default) and, on failure, puts the control back to its last
  saved value (`data-last`). Works for inputs, drawn selects, switches and
  `Ui.DurationInput` (value in seconds). `save` may return a value or a promise.
- `Ui.DurationInput defaultValue` (uncontrolled) — keeps its own state, so
  typing and the steppers work with or without `onChange`; `value` is followed
  when it changes.
- `Ui.Table sortable onSortChange` + `Ui.Table.Body` — client-side sorting
  like `Tailor.sortable`: the clicked header flips `aria-sort`, `Table.Body`
  re-orders rows within each `Table.Group` by the row's `data-<key>`, the
  cell's `data-sort-value` or its text (numbers numerically; ties keep the
  current order). `Table.Th/Td shrink` → `t-col-shrink`.
- `Ui.Menu variant` (summary button variant); `Menu.Item defaultChecked` +
  `onCheckedChange` (uncontrolled checkbox items); `Menu.Kbd` renders a span.
- `Ui.Tabs panelClassName`; a tab without a panel gets no `aria-controls`/id.
- `Ui.Segmented` option `tip`; `Ui.Badge as="button"`; `Ui.Alert dismissible`;
  `Ui.Dialog size="xl"` and `data-dialog-close="<value>"` buttons (the value
  reaches `onClose`); `Ui.Progress label`; `Ui.Code onTabChange` (one `Code.Pre`
  child stays and follows the tab); `Ui.Page as="div"`; `Ui.Section
  bodyClassName`; `Ui.EmptyState` title optional; `Ui.Avatar.Row` without
  name/desc; `Ui.Stat* as="span"`; `Ui.Input htmlSize` (native `size`).
- `Ui.AppShell nav={<Ui.Navbar>…}` / `foot={<Ui.Footer>…}` — the element itself
  becomes the slot (gets `t-shell-nav` / `t-shell-foot`); other content is still
  wrapped as before.
- `Ui.Footer.Pickers parts size` — renders the `[data-tailor-pickers]` host and
  fills it like `renderPickers` (mode toggle, skin and palette selects).
- `relativeTime(date, now)` produces the exact `Tailor.relativeTime` strings
  ("just now", "3 min ago", "2 h ago", "yesterday", "4 d ago", "in 1 h",
  "Sep 21"); `Ui.RelativeTime ago tip` sets `datetime` from `ago` at mount and
  the absolute local time as `data-tip`.
- `useOptionalToasts()`, `popup` (the shared popup registry; it delegates to
  `Tailor.popup` when tailor.js is on the page), `PickerControls`, and the prop
  types (`InputProps`, `SelectProps`, `FormProps`, `SettingsProps`, `SaveFn`, …).
- Never-submit buttons (chip remove, code tabs, sort headers, steppers, select
  options) carry `type="button"`, as tailor.js draws them.

## Theme switcher

React apps get every tailor skin and palette, switched the way HTML apps switch
them: skin and palette selects plus the sun/moon toggle, without `tailor.js`.

1. `tailor apply <dir> --react` (from the tailor repo) vendors
   `public/tailor/` — core CSS, every skin and palette, the sprite and
   `tailor-head.html`, but no `tailor.js`.
2. Paste `public/tailor/tailor-head.html` into the app's `index.html` `<head>`.
   It loads the core CSS, sets `window.TAILOR_CONFIG` and writes the skin and
   palette `<link>`s before the first paint.
3. Render the pickers (`xs` in a `.t-footer`, `sm` elsewhere):

```tsx
import { Ui, useTailorTheme } from "tailor-react";   // or: import { useTailorTheme, Pickers } from "tailor-react/theme"

<Ui.Provider>
  <Ui.AppShell foot={<Ui.Footer.End><Ui.Pickers size="xs" /><Ui.Footer.Version>v1.0</Ui.Footer.Version></Ui.Footer.End>}>…</Ui.AppShell>
</Ui.Provider>

const { skin, palette, mode, choice, set } = useTailorTheme();
set({ palette: "nord" });                            // or set({ skin: "pico" }), set({ mode: "auto" })
```

`useTailorTheme(config?)` returns `{ skin, palette, mode, choice, kit?, set,
config }`. The config defaults to `window.TAILOR_CONFIG`; pass one when the app
has no head snippet. It works like `Tailor.theme`: query params win on the first
read, then `localStorage["<project>.skin|palette|mode"]`, then the defaults;
values outside the config lists are ignored; `auto` follows
`prefers-color-scheme` (and its changes while the choice is auto); the mode is
clamped to what the palette offers. Every change sets `<html data-skin
data-palette data-mode data-mode-choice>`, re-points `#t-skin` (disabled for
"none") and `#t-palette` through their `data-base`, persists, and fires the
bubbling `t:theme` event with the same detail as tailor.js. All components share
one state (a module store + `useSyncExternalStore`); nothing reads `window` at
import, so the module is SSR-safe. On a page that also loads `tailor.js`,
`set()` goes through `Tailor.theme.set` and the hook follows its `t:theme`
events, so both stay in one state (the showcase does this).

`<Ui.Pickers parts={["skin", "palette", "mode"]} size="sm" />` renders the
markup `Tailor.theme.renderPickers` makes: `.t-pickers` with the skin and palette
selects (only when there is a choice; options sorted by label, "No skin" last)
and the mode toggle last (`.t-btn[data-variant=ghost][data-icon=only]`, icon
`bi-sun`/`bi-moon-stars` from the provider sprite, label and `data-tip` "Switch
to light mode", or "Dark only" when the palette has one mode). The selects are
drawn like `Tailor.selects` draws them (button + `ul.t-select-list`), never
browser-native.

## Primer themes per palette

For apps built on Primer React (not tailor-react), every tailor palette is also a
Primer Primitives colour theme, so such an app can wear the tailor palettes. `adapters/primer/themes/<mode>_<id>.css`
(`dark_dracula.css` + `light_dracula.css`, both modes per palette) is generated by
`tailor gen --target primer` / `bin/build` from the stock `@primer/primitives`
dark and light themes and the palette's `primer` mapping; `themes/index.ts`
imports them all (42) and exports the list:

```tsx
import { ThemeProvider } from "@primer/react/next";
import "@primer/primitives/dist/css/primitives.css";
import { PRIMER_THEMES, PRIMER_THEME_LABELS, primerThemeProps, applyPrimerTheme } from "tailor-react/primer/themes";

applyPrimerTheme("dark_dracula");                       // <html data-color-mode="dark" data-dark-theme="dark_dracula">
<ThemeProvider {...primerThemeProps("dark_dracula")} contextOnly>…</ThemeProvider>
```

Import the themes module **after** any stock Primer theme CSS you ship, so the
generated selectors win by order. Each theme is self-contained (only
`primitives.css` is required for size, typography and border tokens). Set the
`data-*` attributes on `<html>` and pass `contextOnly` to `ThemeProvider`: its
wrapper would otherwise derive the colour mode from the scheme *name*, which is
why the themes are named `dark_<id>` / `light_<id>`. `PRIMER_THEME_LABELS` maps a
theme name to the palette's display name for a picker. Import a single theme
(`tailor-react/primer/themes/dark_dracula.css`) when you ship one palette only.

## Layout

- `src/` — CSS-path components (one per tier-1 vocabulary entry, 43 total),
  grouped: `shell.tsx`, `actions.tsx`, `forms.tsx`, `data.tsx`, `feedback.tsx`.
- `parity/fixtures.tsx` — the Ui.* recreation of every canonical markup example.
- `bin/check-parity` — renders each fixture (react-dom/server) and diffs it
  structurally against `core/components.json` (classes/attributes
  order-insensitive; `value`/`checked`/`selected` and `type="button"` may be
  extra on the rendered side). This is the contract check of the first render
  pass (see Drawn controls); run it after touching `src/` or when core
  promotes/changes a tier-1 component.
- `adapters/primer/themes/` — generated Primer Primitives themes (dark + light per
  palette) + `index.ts` for Primer React apps, never edited by hand.
- `src/theme.tsx` — `useTailorTheme`, `Ui.Pickers` (the React `Tailor.theme`).
- `demo/src/kit.tsx` + `islands.tsx` + `vite.kit.config.ts` — the showcase kit bundle
  (`showcase/kit/kit.js`, built by `bin/build`): every tier-1 demo of the showcase
  (the `demo` of `core/components.json`, same variants, texts and interactions)
  rebuilt through `Ui.*` behind the showcase's Kit picker ("React"), plus
  `Ui.Pickers` in its footer. Demo content, never vendored.
- `demo/` — vite demo app (source only; `dist/` is throwaway).

## Consuming from a project

Reference the folder directly (bun workspace / `file:` dependency / vite alias
as in `demo/vite.config.ts`). Peer dependency: react 19. TypeScript consumers
compile the sources (no build step here).

## Verify

```
bun install           # once, in react/
bun run check-parity  # 43/43 tier-1 components must match components.json
bun run typecheck     # tsc --noEmit over src + adapters + parity + demo
bunx vite build demo  # demo builds clean
```

## SSR note

Components render markup-identically on the server (that is what check-parity
asserts). Browser-only behaviour (dialog `showModal`, tooltip layer, toast
portal, relative-time refresh, the drawn parts) runs in effects; `RelativeTime`
renders its children as the static fallback until mounted, and `UiProvider`
only portals its layers when `document` exists (toasts go into an existing
`#t-toasts` region, else the provider renders one; the confirm dialog only
while a `useConfirm()` question is open). There is no `use client` annotation —
consumers using RSC should treat the whole package as client code.

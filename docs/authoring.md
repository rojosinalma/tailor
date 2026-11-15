# Authoring guide

How a component, a shell, a skin or a palette is written. The checks enforce these rules; this page explains them.

## 1. The model

1. **Tokens** (`core/css/tokens.css`) are the only names that anything sizes, spaces and colours with.
2. **A palette** sets the colour tokens, dark and light. **A skin** sets the skin settings and adds an extras
   file that changes looks only. Every skin works with every palette.
3. **A component is written once.** Its stylesheet reads tokens only, so it works in every skin and palette.
4. **Two kits share the stylesheets.** The React kit builds behaviour on Base UI. The HTML kit is plain markup
   plus a small script with no dependencies. Both produce the same classes, parts and state attributes.
5. **The React component is the source.** The build renders every example in "static mode" to make the HTML
   kit's pages, so nobody writes a second demo.

## 2. Where the files of a component go

For a component `<id>` in the pack `<pack>`:

| File                                 | Content                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `core/packs/<pack>/<id>/spec.ts`     | The spec: id, name, pack, group, description, root class, parts, allowed values, HTML kit support |
| `core/packs/<pack>/<id>/<id>.css`    | The stylesheet                                                                                    |
| `core/packs/<pack>/<id>/glyphs.json` | Optional. Icons the component draws itself: `{ "name": "bootstrap-icon-name" }`                   |
| `core/packs/<pack>/<id>/texts.json`  | Optional. Built-in texts the component adds: `{ "key": "English text" }`                          |
| `core/packs/<pack>/<id>/logic.ts`    | Optional. Logic that both kits share. Plain TypeScript, no DOM, with `logic.test.ts`              |
| `react/src/<pack>/<id>/<id>.tsx`     | The React component(s)                                                                            |
| `react/src/<pack>/<id>/examples.tsx` | The showcase entry. Required: a component with no examples fails the build                        |
| `html/src/<pack>/<id>.ts`            | The HTML kit script. Only when the spec says `html: "script"`                                     |
| `checks/behaviour/<pack>/<id>.ts`    | Behaviour tests that run against both kits. Required for `html: "script"`                         |

`bun bin/lib/gen.ts` writes the generated files (`*.gen.ts`: registry, glyphs, texts, pack indexes) and reports
what is missing. Nobody edits an index by hand. Model components: `button` (plain markup), `dialog` (overlay),
`select` (a drawn control over a native one) in the pack `core`, and `date` in the pack `pickers`.

## 3. The spec

```ts
export default defineComponent({
  id: "button",
  name: "Button",
  pack: "core",
  group: "actions",
  description: "Starts an action. A view has at most one primary button.",
  root: "t-btn",
  parts: { "t-btn-label": "the text, when the button also holds an icon" },
  props: { variant: ["default", "primary", "danger", "ghost", "link"], size: SIZES },
  html: "markup",
});
```

1. `props` lists every allowed value. The React types come from it:
   `variant?: (typeof spec.props.variant)[number]`. A wrong value is a type error.
2. `html`: `"markup"` (plain markup, no script), `"script"` (the HTML kit script adds behaviour), `"none"`
   (React only).
3. The reference for agents and the manifest come from the specs.

## 4. Markup and class names

1. Root class `t-<component>`, parts `t-<component>-<part>`. No modifier classes.
2. Variants are attributes: `data-variant`, `data-tone`, `data-size`, plus named ones per component. Leave the
   attribute out for the default value.
3. States are ARIA attributes and the state attributes that Base UI sets: `aria-selected`, `aria-expanded`,
   `aria-disabled`, `aria-invalid`, `aria-current`, `data-open`, `data-popup-open`, `data-highlighted`,
   `data-selected`, `data-checked`, `data-disabled`, `data-starting-style`, `data-ending-style`. The HTML kit
   script sets the same ones. Style a state through these, never through a class.
4. Tones: `data-tone="neutral|accent|success|warning|danger|info"` sets `--t-tone` and `--t-on-tone` on the
   element. A toned component reads those two and never names a colour token for its tone.
5. Field-like boxes (text inputs, select and picker triggers) carry the class `t-control` next to their own.
   Popups carry `t-popup` inside a `t-popup-positioner`; list choices are `t-option`.
6. Semantic HTML first: a button is a `<button>`, a link is an `<a>`, a list is a list, one `<h1>` per page.
7. Every interactive element has an accessible name. An icon-only button has a label.

## 5. Stylesheet rules (`bin/lib/lint-css.ts` fails the build on a violation)

1. Top-level plain selectors. No `@layer` (the build adds it), no `!important`, no id selectors, and every
   class starts with `t-`.
2. Sizes, spacing, colours and durations come from `var(--t-*)` tokens only.
   - a. No `px`, `rem`, `pt`. Raw `em`, `ch`, `lh`, `%`, `fr`, viewport units and `0` are fine.
   - b. No colour literals. `transparent`, `currentColor` and `color-mix(in srgb, var(--t-…) N%, …)` are fine.
   - c. No raw `ms` or `s`: use `var(--t-motion-fast)` or `var(--t-motion-base)` with `var(--t-ease)`.
3. Spacing uses the scale `--t-space-05, 1 … 8`. Control heights use `--t-control-h-sm|md|lg`, which grow to
   the touch size on a touch screen. Box widths use `--t-measure-*`. Text uses `--t-text-*`.
4. Corners: `--t-radius-control` (buttons, fields), `--t-radius-box` (cards, panels), `--t-radius-popup`,
   `--t-radius-pill` (badges, chips), `--t-radius-check`. Lines: `--t-border-w`. Depth: `--t-shadow-*`.
5. Surfaces: `--t-canvas` (page), `--t-inset` (sunken: fields, code, bars), `--t-surface` (raised: cards,
   popups), `--t-selection` (highlight). Text: `--t-text`, `--t-muted`, `--t-disabled`, `--t-link`.
6. Hover styles sit inside `@media (hover: hover)`. Nothing works by hover only.
7. A component adapts to the space it sits in: use a container query (`container-type: inline-size` on the
   component, `@container (max-width: 40rem)`). Only shells and full-screen overlays use
   `@media (max-width: 40rem)` (phone) and `@media (max-width: 64rem)` (tablet). No other breakpoint exists.
8. A component never sets its own outer margin. The parent's layout part sets the gaps (`t-stack`,
   `t-cluster`, `t-grid`, …).
9. Text never overflows its box: flex children that hold text get `min-width: 0`; long values wrap or
   truncate.
10. An exception needs `/* lint-allow: <reason> */` on the line before the declaration.

## 6. React kit rules

1. One file exports the component and its props type. Types come from the spec. No `style` prop, no inline
   styles, no CSS imports.
2. Behaviour comes from Base UI (`@base-ui/react/<part>`), with tailor's classes on its parts. A control that
   Base UI lacks is built from Base UI parts plus shared logic in `logic.ts`.
3. Static mode: `useIsStatic()` from `react/src/kit.tsx` is true while the build renders the HTML kit's
   pages. A component with behaviour then returns only the markup that the HTML kit starts from:
   - a. `html: "markup"` components render the same markup in both modes, so they need no branch.
   - b. A drawn control renders the native control (`<select class="t-control t-select" data-t="select">`).
   - c. An overlay renders its content in the page with `data-t="<name>"`, and its trigger gets a data hook
     (`data-t-open="<id>"`).
4. Built-in texts come from `t("key")`. Add keys in the component's `texts.json`.
5. Icons the component draws itself are glyphs: `<Glyph body={close} />` with the body from
   `@tailor/core/glyphs.gen`. Icons an app picks are `<Icon name="bi:house" />` from the sprite.
6. A link is `<AppLink to="…">` from `react/src/link.tsx`: it goes through the router inside an app, marks
   the current page with `aria-current="page"`, and is a plain `<a>` in the HTML kit.
7. Imports use the aliases `@tailor/core/*` (`core/src`), `@tailor/packs/*` (`core/packs`) and relative paths
   inside `react/src`.

## 7. HTML kit rules

1. `register("<name>", (element) => { … })` from `html/src/runtime.ts` takes over each element marked
   `data-t="<name>"`. It runs once per element, also for elements added later.
2. A drawn control keeps the native element in the form as the value holder (`data-t-upgraded`, hidden, out
   of the tab order) and fires `input` and `change` on it. When the script fails, the native control still
   works.
3. Popups use `createPopup()` from `html/src/popup.ts`. Elements come from `h()`, glyphs from `glyph()`.
4. The script produces the same classes, roles and state attributes as the React kit. No dependency.
5. Page-wide listeners register once with `once("key", …)`.

## 8. Examples

`examples.tsx` exports `defineExamples("<id>", [{ id, title, note?, render, display? }])`.

1. Cover every variant, size, tone and state, including disabled, empty and long content.
2. Examples use tailor components and layout parts only. No own classes, no styles.
3. Every interactive example has an accessible name.
4. Sample data is neutral: `web-1`, `nas`, `alice`, `example.com`.
5. `display: "frame"` gives the example a page of its own: for shells, layouts and parts that fill the screen.

## 9. Behaviour tests

`checks/behaviour/<pack>/<id>.ts` exports `behaviour("<id>", { "what it proves": async ({ page, example,
expect }) => { … } })`. Each test runs in a fresh page, once per kit.

1. Find elements by role and accessible name (`getByRole`), or by a `data-` attribute that both kits set.
   Never by a kit detail.
2. Cover: pointer use, keyboard use, focus on open and on close, the value in the form, disabled state, and
   the phone form where one exists (`page.setViewportSize({ width: 390, height: 800 })`).
3. When the two kits differ, the HTML kit script changes to match Base UI.

## 10. Commands

```sh
bun bin/lib/gen.ts                         # generated files + completeness
bun bin/build                              # dist/ and the showcase site
bunx tsc --noEmit                          # types
bunx biome check --write <paths>           # lint + format
bun bin/lib/lint-css.ts                    # stylesheet rules
bun test <path>                            # unit tests
bun checks/src/run-behaviour.ts <id> …     # behaviour tests of the named components, both kits
```

The pages of a component after a build: `showcase/dist/entry.html?id=<id>` (React kit) and
`showcase/dist/html/<id>.html` (HTML kit). `bun bin/lib/serve.ts` serves them.

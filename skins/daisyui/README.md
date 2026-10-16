# daisyui

System: daisyUI 5.7.50 (on Tailwind CSS 4) · licence: MIT · vendored: no

## How it was built

daisyUI cannot be `@import`ed: it is a Tailwind 4 plugin, its selectors are its own class names
(`btn`, `badge`, `card`, `toggle`…) which read-only tailor markup never carries, and its colours are
OKLCH `--color-*` theme variables. So the component declarations were extracted from the built
`dist/app.css` of a daisyUI reference page (daisyui 5.7.50 + tailwindcss 4.3.3) and re-expressed against `t-*` selectors in `skin.css`, with every
colour mapped onto tailor tokens:

| daisyUI | tailor |
|---|---|
| `--color-base-100` | `--t-canvas` (inputs, page, navbar) / `--t-surface` (cards, modals, menus) |
| `--color-base-200` | `--t-inset` / `--t-selection` |
| `--color-base-300` | `--t-border` |
| `--color-base-content` | `--t-text` (+ `color-mix` 45–60 % for daisy's dimmed text) |
| `--color-primary` | `--t-accent` / `--t-accent-solid`, `-content` → `--t-on-accent` |
| `--color-neutral` (tooltip) | `--t-overlay-bg` |
| `--radius-field / -box / -selector` | `--t-radius-md 0.5rem / -lg 1rem / -sm 0.5rem` (buttons, badges, chips get `--t-radius-full` pills) |

Signature daisy details carried over: 600-weight pill buttons with the `translate: 0 .5px` press,
`tabs-box` segmented controls (inset box, lifted active segment), chunky toggles with a squircle
thumb, ring-style radios, soft-tint badges/alerts, borderless `modal-box` dialogs with the
25px/50px shadow, breadcrumb chevrons, 50 %-dim tab labels, and the SVG-mask `loading-spinner`
(the one allowed `url("data:…svg")`).

## Known gaps (tier-1 components that look approximate)

- Table: daisyUI zebra-stripes optional rows; the tailor hover/tone-tint rows are kept instead.
- Code block: daisyUI's `mockup-code` has traffic-light dots; left out (decoration CSS content).
- Toasts are solid tone fills (daisy `alert-<kind>` in a toast stack); daisy's soft alert is used
  for inline alerts.

## Palette notes (modes checked, excluded palettes and why)

Checked dracula dark, dracula light (Alucard) and catppuccin dark in the showcase; `mode: both`.
No excluded palettes: everything colour-carrying reads `--t-tone` or text-mix derivatives, so any
palette satisfying the token contrast contract renders fine.

# primer

System: GitHub Primer (Primer CSS / Primer React, as documented on [primer.style](https://primer.style)) · licence: MIT · vendored: no

## How it was built

`skin.css` is a hand translation. Primer CSS and Primer React style their own class names (`.btn`, `.Box`, `.Label`,
ActionList parts) with Primer's own colour variables, so the kit cannot be aliased onto tailor markup (SKIN-CONTRACT
rule 5). The skin re-declares Primer's metrics on the `t-*` selectors instead:

- Type: the system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial`), mono
  `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono"`, 14px body at 1.5, 12px captions.
- Shape: 6px corners, 3px checkboxes, 12px overlays (menus, dialogs, pickers), pill Labels, Counters and StateLabels.
- Controls: 32px medium, 28px small, 40px large, 24px xsmall, 1px borders, `0 12px` padding.
- Components: Button (bordered secondary on a subtle fill, solid primary, danger text that fills on hover, invisible),
  ButtonGroup, SegmentedControl, ActionMenu + ActionList, UnderlineNav and TabNav, Breadcrumbs, Pagination, Box rows,
  FormControl + TextInput / Select / Textarea, Checkbox / Radio, ToggleSwitch, Label, CounterLabel, Token, StateLabel,
  Avatar, DataTable, Box, Blankslate, Timeline, Tooltip, Popover, markdown code blocks with ClipboardCopy, Flash,
  Toast (Primer CSS), Dialog, ProgressBar, Spinner, NavList (current row with the 4px accent bar) and the Header.

Primer's functional colour roles map onto the palette tokens, so every palette flows through:

| Primer role | tailor token |
|---|---|
| `bgColor-default` | `--t-canvas` (dark) / `--t-surface` (light) for Boxes and fields |
| `bgColor-muted`, `bgColor-inset` | `--t-inset` |
| overlay background | `--t-surface` |
| `borderColor-default` / `-muted` | `--t-border` / 70 % of it |
| `fgColor-default` / `-muted` / `-disabled` | `--t-text` / `--t-muted` / `--t-disabled` |
| `bgColor-accent-emphasis` + `fgColor-onEmphasis` | `--t-accent-solid` + `--t-on-accent` |
| other `*-emphasis` fills + `fgColor-onEmphasis` | `--t-tone` + `--t-canvas` |
| `fgColor-<role>`, `*-muted` borders, `*-subtle` fills | `--t-tone`, `color-mix()` of it |
| shadows | `color-mix()` of the darkest neutral (`--t-overlay-bg` dark, `--t-text` light) |

Shadows are skin-private (`--p-shadow-*`), because palettes reset `--t-shadow-*` in light mode. Scale overrides are
listed in `manifest.json → tokens_overridden`.

Tier-2 styled: drawer, number, file, date, time, color, select.

## Known gaps (tier-1 components that look approximate)

- Primary buttons follow the palette accent, not GitHub's green; danger hover text uses `--t-canvas`, not white.
- StateLabel has only the solid look in Primer, so `.t-state` and `data-variant="solid"` render alike.
- NavList group titles render larger than their items (tailor convention), not as Primer's 12px muted heading.
- Toasts follow the older Primer CSS Toast (tone-filled icon cell); Primer React has no toast.
- Octicons are not shipped: icons come from the adopted tailor icon sets, glyphs in the markup stay as written.
- The help popover has no caret; the tooltip has no arrow.
- Code tokens use the palette hues in the roles of Primer's syntax theme (entity, keyword, string, constant), not
  its exact colours.

## Palette notes

Checked in both modes on dracula, gruvbox, nord, solarized, catppuccin, flexoki and oxocarbon (full showcase plus the
open dialog, confirm, menu, select listbox, tooltip, help popover, date picker and live toasts). No palette is
excluded: `palette_constraints.mode` is `both`. Light palettes with a very faint `--t-border` (Dracula's Alucard)
keep visible control outlines because inputs and buttons mix the border with `--t-disabled`.

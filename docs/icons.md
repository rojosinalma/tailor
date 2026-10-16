# Icons

tailor ships icon **sets**, not icons: it adopts existing, permissively licensed sets and delivers
a subsetted SVG sprite to each project. It never draws glyphs of its own and never uses an icon font.

## Adopted sets

| Set | Reference | Licence | Icons | Upstream |
|---|---|---|---|---|
| Bootstrap Icons | `bi:<name>` | MIT | ~2,100 | <https://github.com/twbs/icons> |
| Lucide | `lucide:<name>` | ISC | ~1,900 | <https://github.com/lucide-icons/lucide> |
| Simple Icons (brand logos) | `simple-icons:<name>` | CC0-1.0 | ~3,500 | <https://github.com/simple-icons/simple-icons> |

The authoritative list, with exact versions and counts, is `manifest.json → icon_sets` (built from
`icons/sets.json`); `tailor icons list` prints it. Icon data comes from the
[Iconify](https://iconify.design) JSON packages (`@iconify-json/<set>`), pinned in
`icons/package.json`. Only icon data (paths and view boxes) ends up in the sprite; no upstream file
or asset is copied into this repository, and each sprite names every set it draws from together
with its licence in a leading comment.

## Use an icon

1. Find it: `tailor icons search gear` prints `<set>:<name>` references across the adopted sets.
2. Declare the icons your project uses:

   ```sh
   tailor apply <project-dir> --icons bi:house,bi:gear,lucide:settings,simple-icons:github
   ```

   This writes `public/tailor/icons.svg` with one `<symbol id="<set>-<name>">` per icon and
   records the list in the consumer registry; `tailor sync` re-renders it from the current
   data. Re-running `apply` without `--icons` keeps the recorded list; with it, replaces it.
3. Place it in the `.t-icon` slot:

   ```html
   <!-- decorative: next to a label -->
   <button class="t-btn"><svg class="t-icon" aria-hidden="true"><use href="/tailor/icons.svg#bi-gear"/></svg> Settings</button>

   <!-- meaningful on its own: name it -->
   <a href="https://github.com/…"><svg class="t-icon" role="img"><title>GitHub</title><use href="/tailor/icons.svg#simple-icons-github"/></svg></a>
   ```

`.t-icon` is 1em square, inherits `currentColor` (so tones apply: a `t-badge[data-tone="danger"]`
colours its icon), and takes `data-size="xs|sm|lg|xl"`. Decorative icons are `aria-hidden="true"`;
an icon that is the only content of a control is `role="img"` with a `<title>`, or the control
carries `aria-label`. Full rules: `core/conventions.md §2`.

The sprite is a plain file served with your static assets, so `<use href>` needs the same origin
(as every external SVG reference does). The React adapter uses the same markup.

## Showcase

`showcase/icons.svg` is a sample sprite (a few icons per set) that `bin/build` renders so the
showcase's **Icons** section shows every adopted set.

## Add a set

1. Pin its Iconify package in `icons/package.json` (`"@iconify-json/<id>": "<version>"`) and run
   `bun install` in `icons/`.
2. Add one line to `icons/sets.json`: `{ "id": "<id>", "name": "…", "license": "<SPDX>", "upstream": "https://…" }`.
   The licence must match the SPDX id the package's `info.json` declares — `bin/verify` checks it.
   Only sets whose licence allows redistribution of the icon data belong here.
3. `bin/build` → `manifest.json → icon_sets` gains the entry (name, version, count, licence from the
   installed data) and `showcase/icons.svg` a sample of it. Add the row above and a CHANGELOG line.
4. `bin/verify` — exit 0.

Without the packages installed, `bin/build` keeps the committed entries and says so, and
`bin/verify` warns instead of checking currency.

# tailor CLI

`bin/tailor` (Bun, single file, no dependencies — it shares `bin/lib/common.js` with the other
tooling) distributes tailor's assets to consuming projects: idempotent vendoring, no package
manager, managed-header files, a consumer registry.

```
tailor apply <project-dir> [--skin all|bootstrap,webtui,...] [--palettes all|gruvbox,all|dracula,nord] [--icons bi:house,...] [--mode auto|dark|light] [--react] [-n]
tailor sync [<project-dir>|--all]      # re-vendor managed files (header-guarded, idempotent)
tailor list                            # skins · palettes · icon sets · consumers
tailor move <old-dir> <new-dir> [-n]   # repoint a recorded consumer after its project moved
tailor forget <dir> [-n]               # drop a recorded consumer (project files untouched)
tailor icons search <term>             # find <set>:<name> refs across the adopted icon sets (icons list: the sets)
tailor gen --target primer <palette>   # Primer Primitives theme for one palette (--all: every palette)
tailor gen <system> <palette>          # optional: passthrough to an external theme generator
```

## Install

Run it in place (`<repo>/bin/tailor …`) or symlink it onto `PATH`:

```sh
ln -s "$PWD/bin/tailor" ~/.local/bin/tailor
```

## Commands

### `tailor apply <project-dir> [--skin <id,...|all>] [--palettes <id,...|all>] [--icons <set:name,...>] [--mode dark|light|auto] [--react] [-n]`

Vendors into `<project-dir>/public/tailor/`:

| File | What |
|---|---|
| `tokens.css` `base.css` `layout.css` `tailor.js` | core (contract load order) |
| `skins/<id>/skin.css` | each chosen skin (default `all` = every skin; first listed = default, `webtui,all` = all with webtui default) |
| `palettes/<id>.css` | each chosen palette (default `all`; first listed = default, `gruvbox,all`), generated from `palettes/src/<id>.json` |
| `icons.svg` | sprite of the icons named in `--icons` plus the icons tailor.js renders itself: sun/moon toggle (`bi:sun`, `bi:moon-stars`) and the toast/confirm tone icons (`bi:check-circle`, `bi:exclamation-triangle`, `bi:x-circle`, `bi:info-circle`, `bi:question-circle`) and the drawn-control glyphs (`bi:chevron-down`, `bi:clock`, `bi:plus-lg`, `bi:dash-lg`), one `<symbol id="<set>-<name>">` each, from the adopted sets (`icons/`) |
| `tailor-head.html` | ready-made `<head>` snippet — see below |

The snippet carries the three core `<link>`s in contract order, the pre-paint IIFE (configured with
the project's localStorage prefix = the project directory's basename, the bundled skin/palette lists
and the chosen defaults; `?skin= ?palette= ?mode=` win for first paint), a deferred
`<script src="/tailor/tailor.js">` and the `Tailor.theme.init` call. Paste its content into the
layout's `<head>`; app CSS loads after it. Asset URLs assume `public/` is served at `/`
(so `/tailor/...`).

`--icons` takes `<set>:<name>` references (`tailor icons search` finds them); every one must exist in an
adopted set or apply exits non-zero. It needs the icon data installed (`bun install` in `icons/`). On a
re-apply, omitting `--icons` keeps the consumer's recorded list; passing it replaces the list.
`--react` skips `tailor.js` and points at the `react/` adapter workspace instead; the React adapter and the
Primer kit are consumed as source from `react/`, never vendored — `apply`/`sync` copy nothing from `react/`
or `showcase/`.
The first skin/palette listed becomes the default; `all` expands in place to every id tailor ships, so
`--palettes gruvbox,all` = every palette with gruvbox as default. Adopting means taking everything tailor
ships at that moment; later additions arrive through `tailor sync`. `--mode` (default `auto`) sets the
first-visit mode: `auto` follows `prefers-color-scheme` until the user clicks the sun/moon toggle.

Every apply upserts the consumer into `consumers.json` (path, skins, palettes, icons, mode, react,
version, date).

### `tailor sync [<project-dir> | --all] [-n]`

Re-vendors current versions into recorded consumers. Per file it reports
`unchanged` / `changed` / `missing` (recreated) / `refused`. A file whose first line lost the
`managed by tailor` header is **never overwritten** — it is reported as refused with instructions,
and sync exits 1. A consumer whose skin or palette no longer exists is skipped with a note
(so a half-built skin never breaks `--all`). A consumer whose directory is gone is skipped with a hint:
`tailor move <old> <new>` if the project moved, `tailor forget <dir>` if it is retired.

Sync also checks the consumer's git repo for an untracked `.git/info/leak-patterns` (one extended regex per
line that each commit is checked against). When a public repo has none, or its visibility cannot be told
(no GitHub `origin`, no `gh`, no network), sync prints a `warning` line for that consumer. The warning never
changes the exit code; private repos and repos without a remote get no warning.

### `tailor move <old-dir> <new-dir> [-n]`

Repoints the consumer recorded at `<old-dir>` to `<new-dir>` in `consumers.json`; skins, palettes, icons,
mode, react, version and date are kept. Use it after a project moves, instead of a re-apply at the new path
(which records a second consumer and keeps the stale one). `<old-dir>` may no longer exist. Both paths are
resolved like `apply`/`sync` and matched exactly. Exits 1 with the reason when `<old-dir>` is not recorded,
`<new-dir>` is missing or not a directory, `<new-dir>` is already recorded, or both paths are the same.
Nothing is vendored; run `tailor sync <new-dir>` afterwards if the vendored files need refreshing.

### `tailor forget <dir> [-n]`

Removes the consumer recorded at `<dir>` from `consumers.json`, for a retired project. The project's files
are never touched: vendored files under `public/tailor/` stay until the project deletes them. The path is
resolved and matched like `move`; exits 1 when `<dir>` is not recorded.

### `tailor list`

Skins (component coverage + mode constraint from each `skins/<id>/manifest.json`; unreadable
manifests are shown, not fatal), the canonical palettes (mode(s) + name), the adopted icon sets
(count, licence, version), and the recorded consumers.

### `tailor icons search <term> [--limit N]` · `tailor icons list`

`search` prints `<set>:<name>` for every icon (or alias) whose name contains the term, across the
adopted sets — exact and prefix matches first, 50 by default — in the form `--icons` takes; exits 1 on no
hit. `list` prints the adopted sets with count, licence, version and upstream. See [icons.md](icons.md).

### `tailor gen --target primer <palette> | --all`

Emits the palette as **Primer Primitives colour themes**: `react/adapters/primer/themes/dark_<id>.css`
from the stock `dark.css` and, when the palette has a `light` block (all 21 do), `light_<id>.css` from the
stock `light.css` of the `@primer/primitives` version pinned in `react/package.json` (run `bun install` in
`react/` once; `TAILOR_PRIMER_PRIMITIVES` points at another directory of Primer functional theme CSS). Every
token of the stock theme is kept and recoloured through the palette's `primer` section
(`palettes/src/<id>.json`), in this order:

1. `primer.tokens` — whole-value override for a named token (`--fgColor-link`, the primary button family).
2. `primer.map` — exact source hex → target hex (alpha on 8-digit hex and `rgba()` is kept, RGB remapped).
3. nearest — anything else: low-chroma colours land on the palette's `neutrals` ramp by lightness; chromatic
   colours take the nearest `roles` hue (or a forced `primer.hue_ranges` band, e.g. GitHub blue → the accent)
   at the source's lightness; very dark chromatic tints (label backgrounds) are mixed over `canvas`.
4. `var(...)`, `color-mix(...)`, fully transparent colours and non-colour values pass through. Dark colours
   inside `*shadow*` tokens become `primer.shadow_color`, so shadows stay deep.

The theme is named `<mode>_<id>` because Primer React derives the colour mode from the name (`dark_*` is
dark, anything else light). The light theme needs no hand-tuning of its own: it is derived from the dark
mapping — the light block's surfaces/text replace the stock light surfaces/text exactly, each `hue_ranges`
target becomes the light counterpart of the same role, and the link/primary-button tokens come from the
block's `link`/`accent`. `--base dark|light` with `--out` writes a single file. `--all` regenerates every palette that has a `primer` section plus
`themes/index.ts` (the module a React consumer imports — see `react/README.md`); `bin/build` does the same,
and `bin/verify` fails when a committed theme no longer matches its palette. The command prints a summary
per palette (tokens, overrides, exact and nearest hits, pass-throughs); `bin/gen-primer-theme <id>` adds the
most frequent source colours and where they landed — the list to read when tuning a mapping. A palette
without a `primer` section has no Primer theme; add the section (start from `dracula.json`'s) to get one.

### `tailor gen <system> <palette>` (optional)

Without `--target`, `gen` is a passthrough to an external theme generator found via `WEB_UI_DESIGN_ASSETS`,
for emitting other frameworks' themes from the same palette JSON. When the variable is unset or the
generator is absent, `gen` exits non-zero with a message and nothing else in tailor is affected. Output
goes to stdout exactly as the generator prints it.

## Configuration

See [configuration.md](configuration.md) for `TAILOR_PALETTES`, `TAILOR_PRIMER_PRIMITIVES`,
`WEB_UI_DESIGN_ASSETS` and `consumers.json`.

## Flags & behaviour

- `-n` / `--dry-run` — print what would be written/changed; writes nothing, registry untouched.
- Unknown commands, flags, skins or palettes exit non-zero and name the valid choices.
- Managed header, first line of every vendored file (HTML comment in the snippet):

  ```
  /* managed by tailor v<version> — <core|skin <id>|palette <id>|icons (<n>)|head snippet> — do not edit, run `tailor sync` */
  ```

  (an HTML/XML comment in the head snippet and the icon sprite).

  The version comes from `package.json`. `sync` identifies its files by the
  `managed by tailor` marker alone and refuses to touch files without it.

- Consumers are recorded in `consumers.json` (local state, not committed;
  `consumers.example.json` is the template). `apply` adds or updates an entry, `move` repoints one,
  `forget` removes one; consumers are matched by exact resolved path, so a moved project needs `move`, not a
  re-apply.

## Examples

```sh
tailor apply ~/code/myapp                                                   # every skin + palette, bootstrap/ayu default, mode auto
tailor apply ~/code/myapp --skin webtui,all --palettes gruvbox,all          # everything, webtui + gruvbox default
tailor apply ~/code/myapp --skin pico --palettes dracula --mode dark -n     # a deliberate subset
tailor apply ~/code/myapp --icons bi:house,bi:gear,lucide:settings,simple-icons:github
tailor icons search gear
tailor sync --all
tailor move ~/code/myapp ~/code/apps/myapp -n                               # preview a repoint after a move
tailor forget ~/code/oldapp                                                 # retired project, files untouched
tailor gen --target primer dracula
tailor gen daisyui nord
```

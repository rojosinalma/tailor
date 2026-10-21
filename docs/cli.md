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
`--react` skips `tailor.js` and vendors tailor-react instead: `package.json`, `src/`, `LICENSE` and `README.md`
go to `vendor/tailor-react/` under the project's **workspace root** — the nearest directory at or above
`<project-dir>` whose `package.json` declares `workspaces`, never above the project's git repo — or under
`<project-dir>` when there is none. Every file carries the managed header (in `package.json` it is the `"//"`
field); the version is pinned to the tailor release, and `@types/react` / `@types/react-dom` are listed as
devDependencies so isolated installs resolve the React types. Wire it as a workspace member
(`"workspaces": ["vendor/tailor-react", …]` + `"tailor-react": "workspace:*"`) or a `file:` dependency; the app
then builds from its own repo on any machine. A hand-made copy (a `vendor/tailor-react/package.json` named
`tailor-react` without the header) is taken over once (`taken over`), its `src/` pruned to the release. Nothing
from `showcase/` is ever vendored. Under `--react` the head snippet keeps the core links, the pre-paint IIFE and
`window.TAILOR_CONFIG`, but leaves out the `tailor.js` `<script>` and the `Tailor.theme.init` call (the file is
not vendored); `useTailorTheme()` / `<Ui.Pickers>` from `tailor-react` read `window.TAILOR_CONFIG` and take
over the switcher (`react/README.md` → Theme switcher). HTML consumers never receive React code.
The first skin/palette listed becomes the default; `all` expands in place to every id tailor ships, so
`--palettes gruvbox,all` = every palette with gruvbox as default. Adopting means taking everything tailor
ships at that moment; later additions arrive through `tailor sync`. `--mode` (default `auto`) sets the
first-visit mode: `auto` follows `prefers-color-scheme` until the user clicks the sun/moon toggle.

Every apply upserts the consumer into `consumers.json` (path, skins, `skins_all`, palettes, `palettes_all`, icons,
mode, react, version, date). `skins_all` / `palettes_all` are true when the list was given as `all` (the
default, also `gruvbox,all`): such a consumer also adopts what later releases add, on `sync`.

### `tailor sync [<project-dir> | --all] [-n]`

Re-vendors current versions into recorded consumers, `vendor/tailor-react/` included for `react` ones. Per file it
reports `unchanged` / `changed` / `missing` (recreated) / `refused` / `removed` (a managed file the release no
longer ships). A consumer with `skins_all` / `palettes_all` gets new skins and palettes appended after its list
(`adopts …`, the default stays first); rows recorded before 0.11.0 have no flags and count as adopting
everything when they hold every palette tailor ships. A file whose first line lost the
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

### `tailor gen <system> <palette>` (optional)

`gen` is a passthrough to an external theme generator found via `WEB_UI_DESIGN_ASSETS`,
for emitting other frameworks' themes from the same palette JSON. When the variable is unset or the
generator is absent, `gen` exits non-zero with a message and nothing else in tailor is affected. Output
goes to stdout exactly as the generator prints it. The built-in `--target primer` (Primer Primitives themes)
was removed in 0.11.0; passing `--target` exits non-zero with that message. The `primer` skin is the Primer
look in tailor markup.

## Configuration

See [configuration.md](configuration.md) for `TAILOR_PALETTES`, `WEB_UI_DESIGN_ASSETS` and
`consumers.json`.

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
tailor gen daisyui nord
```

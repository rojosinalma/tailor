# tailor CLI

`bin/tailor` (Bun, single file, no dependencies — it shares `bin/lib/common.js` with the other
tooling) distributes tailor's assets to consuming projects: idempotent vendoring, no package
manager, managed-header files, a consumer registry.

```
tailor apply <project-dir> --skin bootstrap[,webtui,...|all] --palettes dracula,gruvbox [--mode dark] [--react] [-n]
tailor sync [<project-dir>|--all]      # re-vendor managed files (header-guarded, idempotent)
tailor list                            # skins · palettes · consumers
tailor gen <system> <palette>          # optional: passthrough to an external theme generator
```

## Install

Run it in place (`<repo>/bin/tailor …`) or symlink it onto `PATH`:

```sh
ln -s "$PWD/bin/tailor" ~/.local/bin/tailor
```

## Commands

### `tailor apply <project-dir> [--skin <id,...>] [--palettes <id,...>] [--mode dark|light|auto] [--react] [-n]`

Vendors into `<project-dir>/public/tailor/`:

| File | What |
|---|---|
| `tokens.css` `base.css` `layout.css` `tailor.js` | core (contract load order) |
| `skins/<id>/skin.css` | each chosen skin (default `bootstrap`; `all` = every skin, first = default) |
| `palettes/<id>.css` | each chosen palette (default `dracula`), generated from `palettes/src/<id>.json` |
| `tailor-head.html` | ready-made `<head>` snippet — see below |

The snippet carries the three core `<link>`s in contract order, the pre-paint IIFE (configured with
the project's localStorage prefix = the project directory's basename, the bundled skin/palette lists
and the chosen defaults; `?skin= ?palette= ?mode=` win for first paint), a deferred
`<script src="/tailor/tailor.js">` and the `Tailor.theme.init` call. Paste its content into the
layout's `<head>`; app CSS loads after it. Asset URLs assume `public/` is served at `/`
(so `/tailor/...`).

`--react` skips `tailor.js` and points at the `react/` adapter workspace instead.
The first palette in `--palettes` becomes the default. `--mode` sets the default mode choice
(`auto` resolves via `prefers-color-scheme`).

Every apply upserts the consumer into `consumers.json` (path, skins, palettes, mode, react,
version, date).

### `tailor sync [<project-dir> | --all] [-n]`

Re-vendors current versions into recorded consumers. Per file it reports
`unchanged` / `changed` / `missing` (recreated) / `refused`. A file whose first line lost the
`managed by tailor` header is **never overwritten** — it is reported as refused with instructions,
and sync exits 1. A consumer whose skin or palette no longer exists is skipped with a note
(so a half-built skin never breaks `--all`).

### `tailor list`

Skins (component coverage + mode constraint from each `skins/<id>/manifest.json`; unreadable
manifests are shown, not fatal), the canonical palettes (mode(s) + name), and the recorded
consumers.

### `tailor gen <system> <palette>` (optional)

Passthrough to an external theme generator found via `WEB_UI_DESIGN_ASSETS`, for emitting full per-framework themes from the same palette JSON. When
the variable is unset or the generator is absent, `gen` exits non-zero with a message and nothing
else in tailor is affected. Output goes to stdout exactly as the generator prints it.

## Configuration

See [configuration.md](configuration.md) for `TAILOR_PALETTES`, `WEB_UI_DESIGN_ASSETS` and
`consumers.json`.

## Flags & behaviour

- `-n` / `--dry-run` — print what would be written/changed; writes nothing, registry untouched.
- Unknown commands, flags, skins or palettes exit non-zero and name the valid choices.
- Managed header, first line of every vendored file (HTML comment in the snippet):

  ```
  /* managed by tailor v<version> — <core|skin <id>|palette <id>|head snippet> — do not edit, run `tailor sync` */
  ```

  The version comes from `package.json`. `sync` identifies its files by the
  `managed by tailor` marker alone and refuses to touch files without it.

- Consumers are recorded in `consumers.json` (local state, not committed;
  `consumers.example.json` is the template).

## Examples

```sh
tailor apply ~/code/myapp --skin bootstrap --palettes dracula,gruvbox
tailor apply ~/code/myapp --skin all --palettes dracula,nord,gruvbox       # runtime skin switcher in the consumer
tailor apply ~/code/myapp --skin pico --palettes dracula --mode auto -n
tailor sync --all
tailor gen daisyui nord
```

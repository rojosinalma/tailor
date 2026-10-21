# Configuration

| Setting | Default | Purpose |
|---|---|---|
| `TAILOR_PALETTES` | `palettes/src` | directory of canonical palette JSON + `palette.schema.json` read by `bin/gen-palette`, `bin/build` and `tailor apply` |
| `icons/package.json` + `icons/sets.json` | the three adopted sets | the Iconify JSON packages (`@iconify-json/<id>`, pinned) and the adopted-set list that `bin/build`, `bin/verify` and `tailor apply --icons` / `tailor icons` read after `bun install` in `icons/`; without the install, build keeps the committed `icon_sets`, verify warns, `--icons` refuses |
| `WEB_UI_DESIGN_ASSETS` | unset | root of an external theme generator for `tailor gen`; without it `gen` exits with a message, nothing else is affected |
| `consumers.json` | `{ "consumers": [] }` | registry at the repo root written by `tailor apply` (`move` repoints an entry, `forget` removes one), read by `sync`/`list`; **local state, gitignored** — copy `consumers.example.json` to start or let the first `apply` create it |

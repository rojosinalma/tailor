# Configuration

| Setting | Default | Purpose |
|---|---|---|
| `TAILOR_PALETTES` | `palettes/src` | directory of canonical palette JSON + `palette.schema.json` read by `bin/gen-palette`, `bin/build` and `tailor apply` |
| `WEB_UI_DESIGN_ASSETS` | unset | root of an external theme generator for `tailor gen`; without it `gen` exits with a message, nothing else is affected |
| `consumers.json` | `{ "consumers": [] }` | registry at the repo root written by `tailor apply`, read by `sync`/`list`; **local state, gitignored** — copy `consumers.example.json` to start or let the first `apply` create it |

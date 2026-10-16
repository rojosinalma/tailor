# Configuration

| Setting | Default | Purpose |
|---|---|---|
| `TAILOR_PALETTES` | `palettes/src` | directory of canonical palette JSON + `palette.schema.json` read by `bin/gen-palette`, `bin/build` and `tailor apply` |
| `TAILOR_PRIMER_PRIMITIVES` | `react/node_modules/@primer/primitives/dist/css/functional/themes` | directory holding the stock Primer functional theme CSS (`dark.css`) that `tailor gen --target primer`, `bin/gen-primer-theme`, `bin/build` and `bin/verify` derive the Primer themes from; the default is the version pinned in `react/package.json` after `bun install` there |
| `WEB_UI_DESIGN_ASSETS` | unset | root of an external theme generator for `tailor gen`; without it `gen` exits with a message, nothing else is affected |
| `consumers.json` | `{ "consumers": [] }` | registry at the repo root written by `tailor apply`, read by `sync`/`list`; **local state, gitignored** — copy `consumers.example.json` to start or let the first `apply` create it |

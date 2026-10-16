# tailor-react

The React adapter for tailor: the `Ui.*` component API over the tailor
markup vocabulary (`core/components.json`). Workspace-local, consumed as
source — **not published**.

```tsx
import { Ui, UiProvider, useToasts, useConfirm } from "tailor-react";

<UiProvider>
  <Ui.Button tone="danger" variant="ghost">Delete</Ui.Button>
  <Ui.Field label="Hostname" hint="The LAN name."><Ui.Input /></Ui.Field>
</UiProvider>
```

## The two render paths

1. **CSS path (default, `src/`)** — every component renders *exactly* the tailor
   markup: same `t-*` classes, data-attributes and aria states as
   `core/components.json`, so every tailor skin × palette works unchanged. Load
   the CSS per `core/conventions.md` §1 (tokens → base → layout → skin →
   palette; see `demo/src/main.tsx`). **Do not load `core/tailor.js`** — the
   behaviours (tabs, menus, listbox, dialogs, toasts, tooltips, help, copy,
   settings autosave, relative time, filters) are reimplemented as React state
   with controlled/uncontrolled props. Not reimplemented: `Tailor.scrollspy`
   and `Tailor.sortable`'s client-side row sorting (sort state/aria is managed,
   the consumer sorts its own data) and `Tailor.theme` (the switcher stays a
   pre-paint script per the SDD).
2. **Kit adapters (`adapters/<kit>/`)** — the same `Ui.*` API rendered through a
   component kit instead of tailor CSS. First kit: **Primer**
   (`adapters/primer/`, @primer/react 38.40.1) — see its README for the mapping
   and the un-mappables (which fall back to the CSS-path components).

## Layout

- `src/` — CSS-path components (one per tier-1 vocabulary entry, 43 total),
  grouped: `shell.tsx`, `actions.tsx`, `forms.tsx`, `data.tsx`, `feedback.tsx`.
- `parity/fixtures.tsx` — the Ui.* recreation of every canonical markup example.
- `bin/check-parity` — renders each fixture (react-dom/server) and diffs it
  structurally against `core/components.json` (classes/attributes
  order-insensitive). This is the contract check; run it after touching `src/`
  or when core promotes/changes a tier-1 component.
- `adapters/primer/` — the Primer adapter + mapping docs.
- `demo/` — vite demo app (source only; `dist/` is throwaway).

## Consuming from a project

Reference the folder directly (bun workspace / `file:` dependency / vite alias
as in `demo/vite.config.ts`). Peer dependency: react 19. TypeScript consumers
compile the sources (no build step here).

## Verify

```
bun install           # once, in react/
bun run check-parity  # 43/43 tier-1 components must match components.json
bun run typecheck     # tsc --noEmit over src + adapters + parity + demo
bunx vite build demo  # demo builds clean
```

## SSR note

Components render markup-identically on the server (that is what check-parity
asserts). Browser-only behaviour (dialog `showModal`, tooltip layer, toast
portal, relative-time refresh) runs in effects; `RelativeTime` renders its
children as the static fallback until mounted, and `UiProvider` only portals
its layers when `document` exists. There is no `use client` annotation —
consumers using RSC should treat the whole package as client code.

# Use tailor in your project

1. Copy `core/*` → `public/tailor/`, one or more `skins/<id>/skin.css` → `public/tailor/skins/<id>/`,
   the palettes you offer → `public/tailor/palettes/` — or let the CLI do it:
   `bin/tailor apply <project-dir> --skin bootstrap,webtui --palettes dracula,gruvbox --icons bi:house,lucide:settings`
   (see [cli.md](cli.md)). `--icons` names the icons you use; the CLI writes them as one sprite,
   `public/tailor/icons.svg` (see [icons.md](icons.md)).
2. In your layout, in this order:

```html
<link rel="stylesheet" href="/tailor/tokens.css">
<link rel="stylesheet" href="/tailor/base.css">
<link rel="stylesheet" href="/tailor/layout.css">
<script>/* pre-paint snippet from the core/tailor.js header: writes #t-skin and #t-palette from ?skin= ?palette= ?mode= / localStorage */</script>
<link rel="stylesheet" href="/css/app.css">
…
<div class="t-toasts" id="t-toasts" aria-live="polite"></div>
<dialog class="t-dialog" id="t-confirm" data-variant="confirm">…</dialog>   <!-- markup: core/components.json → confirm -->
<script src="/tailor/tailor.js"></script>
<script>
Tailor.theme.init({
  project: "myapp",
  skins: ["bootstrap", "webtui"],
  palettes: ["dracula", "gruvbox"],
  modes: { dracula: ["dark", "light"], gruvbox: ["dark"] },
  defaults: { skin: "bootstrap", palette: "dracula", mode: "dark" }
});
</script>
```

   `tailor apply` writes this block for you as `public/tailor/tailor-head.html`. The switcher is one
   element: `<div data-tailor-pickers></div>` — `Tailor.theme` renders skin, palette and mode selects into
   it, options sorted by name. Put it in the footer when the layout has one, otherwise last in the navbar.

3. Write markup from `core/components.json` (every component has a canonical `markup` snippet) and
   read `core/conventions.md` once. Icons: `<svg class="t-icon" aria-hidden="true"><use href="/tailor/icons.svg#bi-house"/></svg>`
   (`tailor icons search <term>` finds names). Skin and palette are application settings; localStorage is
   only the pre-paint cache.
4. Your own look: `skins/SKIN-CONTRACT.md` — a skin is one CSS file + a manifest, and `bin/verify`
   tells you when it covers the whole vocabulary. Your own colours: one JSON in `palettes/src/`
   against `palettes/src/palette.schema.json`, then `bin/gen-palette <id>`.

## React

`react/` ("tailor-react") renders the same vocabulary as `Ui.*` components, with a kit adapter
seam (first kit: Primer; every palette is also a generated Primer theme). See `react/README.md`.

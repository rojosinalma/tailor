// tailor — showcase generator (used by bin/build). Produces showcase/index.html from core/components.json
// + the skins and palettes found at build time. Static: no fetch at runtime, works from file://.

import { readJson, CORE, VERSION } from "./common.js";
import { join } from "node:path";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const prettyMarkup = (m) => m.replace(/'/g, '"');

export function renderShowcase({ skins, palettes, modes }) {
  const vocab = readJson(join(CORE, "components.json"));
  const groups = Object.entries(vocab.groups);
  const tier1 = vocab.components.filter((c) => c.tier === 1);
  const byGroup = (g) => tier1.filter((c) => c.group === g);
  const config = { project: "tailor-showcase", skins: ["none", ...skins.map((s) => s.id)], palettes: palettes.map((p) => p.id), modes, defaults: { skin: skins[0]?.id ?? "none", palette: "dracula", mode: "dark" } };

  const sideNav = groups.map(([g, title]) => `
        <li class="t-sidebar-group">${esc(title)}</li>
        ${byGroup(g).map((c) => `<li><a class="t-sidebar-item" href="#${c.id}"><span class="t-sidebar-item-name">${esc(c.name)}</span>${c.behaviour !== "none" ? '<span class="t-badge" data-size="xs" data-tone="accent" title="has behaviour (tailor.js)">js</span>' : ""}</a></li>`).join("\n        ")}`).join("");

  const sections = groups.map(([g, title]) => `
      <h2 class="sc-group" id="group-${g}">${esc(title)}</h2>
      ${byGroup(g).map((c) => `
      <section class="t-card sc-component" id="${c.id}" data-group="${g}">
        <div class="t-card-header"><h3 class="t-card-title">${esc(c.name)} <code class="sc-id">${c.root}</code></h3>${c.behaviour !== "none" ? `<span class="t-badge" data-tone="accent" data-size="xs">${esc(c.behaviour)}</span>` : ""}<a class="sc-only" href="?only=${c.id}" data-only-link title="Show only this section">⤢</a></div>
        <div class="t-card-body">
          <p class="t-muted t-small sc-desc">${esc(c.description)}</p>
          <div class="sc-demo">${c.demo ?? c.markup}</div>
          <details class="sc-markup"><summary class="t-small">Markup</summary><pre class="t-code-pre"><code>${esc(prettyMarkup(c.markup))}</code></pre>${c.notes ? `<p class="t-muted t-small">${esc(c.notes)}</p>` : ""}</details>
        </div>
      </section>`).join("")}`).join("");

  const paletteOpts = palettes.map((p) => `<option value="${p.id}">${esc(p.name)}${p.license.startsWith("values-only") ? " ·" : ""}</option>`).join("");
  const skinOpts = ['<option value="none">none (core only)</option>', ...skins.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`)].join("");

  return `<!doctype html>
<html lang="en" data-palette="dracula" data-mode="dark" data-skin="none">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>tailor showcase</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../core/tokens.css">
  <link rel="stylesheet" href="../core/base.css">
  <link rel="stylesheet" href="../core/layout.css">
  <script>
    /* Pre-paint (after the core links so skin + palette cascade over tokens.css): ?skin= ?palette= ?mode= → localStorage → defaults; sets data-* on <html> and the two <link>s before first paint. */
    (function(){var C=${JSON.stringify(config)};var P=C.project,q=new URLSearchParams(location.search);
    function g(k){var v=q.get(k);try{return v||localStorage.getItem(P+'.'+k)||C.defaults[k]}catch(e){return v||C.defaults[k]}}
    var h=document.documentElement,s=g('skin'),p=g('palette'),m=g('mode');
    if(C.skins.indexOf(s)<0)s=C.defaults.skin;if(C.palettes.indexOf(p)<0)p=C.defaults.palette;
    if(m==='auto')m=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
    var modes=C.modes[p]||['dark'];if(modes.indexOf(m)<0)m=modes[0];
    h.dataset.skin=s;h.dataset.palette=p;h.dataset.mode=m;window.TAILOR_SHOWCASE=C;
    document.write('<link id="t-skin" rel="stylesheet" data-base="../skins/" href="'+(s==='none'?'':'../skins/'+s+'/skin.css')+'"'+(s==='none'?' disabled':'')+'>');
    document.write('<link id="t-palette" rel="stylesheet" data-base="../palettes/" href="../palettes/'+p+'.css">');})();
  </script>
  <link rel="stylesheet" href="showcase.css">
</head>
<body>
<div class="t-shell">
  <header class="t-navbar t-shell-nav">
    <a class="t-navbar-brand" href="./"><span class="t-icon">✂</span>tailor</a>
    <span class="t-badge" data-tone="accent">v${VERSION}</span>
    <span class="t-badge" data-tone="info">${tier1.length} tier-1 · ${vocab.components.length - tier1.length} tier-2</span>
    <span class="sc-only-bar t-small t-muted" hidden>Showing one section · <a href="./">all sections</a></span>
    <div class="t-navbar-end" style="margin-left:auto">
      <label class="t-visually-hidden" for="pick-skin">Skin</label>
      <select class="t-select" data-size="sm" id="pick-skin" data-tailor-picker="skin">${skinOpts}</select>
      <label class="t-visually-hidden" for="pick-palette">Palette</label>
      <select class="t-select" data-size="sm" id="pick-palette" data-tailor-picker="palette">${paletteOpts}</select>
      <label class="t-visually-hidden" for="pick-mode">Mode</label>
      <select class="t-select" data-size="sm" id="pick-mode" data-tailor-picker="mode"><option value="dark">Dark</option><option value="light">Light</option><option value="auto">Auto</option></select>
    </div>
  </header>
  <aside class="t-shell-side">
    <nav class="t-sidebar" aria-label="Sections" id="sections-nav">
      <ul>${sideNav}
      </ul>
    </nav>
  </aside>
  <main class="t-shell-main t-page">
    <header class="t-page-header">
      <h1 class="t-page-title">tailor showcase</h1>
      <span class="t-page-lead">every tier-1 component once, in tailor markup · skin and palette swap underneath</span>
      <div class="t-page-actions"><span class="t-small t-muted" id="sc-state"></span></div>
    </header>
    <div class="t-alert" data-tone="info" role="status" id="sc-core-note"><span class="t-icon t-alert-icon">ⓘ</span><div class="t-alert-body"><b>Core only.</b> No skin is applied: what you see is <code>core/base.css</code> — the functional baseline every skin builds on. Pick a skin above once one exists.</div></div>
    <div id="sections">${sections}
    </div>
  </main>
  <footer class="t-footer t-shell-foot">
    <div class="t-footer-end"><span class="t-footer-version">tailor ${VERSION} · ${skins.length} skins · ${palettes.length} palettes</span><button class="t-btn" data-variant="ghost" data-size="sm" data-tailor-mode-toggle aria-label="Toggle light/dark">☼</button></div>
  </footer>
</div>
<div class="t-toasts" id="t-toasts" aria-live="polite" aria-atomic="false"></div>
<script src="../core/tailor.js" data-tailor="manual"></script>
<script src="showcase.js"></script>
</body>
</html>
`;
}

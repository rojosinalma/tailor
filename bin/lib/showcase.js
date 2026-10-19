// tailor — showcase generator (used by bin/build). Produces showcase/index.html from core/components.json
// + the skins and palettes found at build time. Static: no fetch at runtime, works from file://.

import { readJson, CORE, VERSION } from "./common.js";
import { join } from "node:path";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const prettyMarkup = (m) => m.replace(/'/g, '"');

export function renderShowcase({ skins, palettes, modes, iconSets = [] }) {
  const vocab = readJson(join(CORE, "components.json"));
  const groups = Object.entries(vocab.groups);
  const tier1 = vocab.components.filter((c) => c.tier === 1);
  const byGroup = (g) => tier1.filter((c) => c.group === g);
  const labels = { skins: Object.fromEntries(skins.map((s) => [s.id, s.name])), palettes: Object.fromEntries(palettes.map((p) => [p.id, p.name + (p.license.startsWith("values-only") ? " \u00b7" : "")])) };
  const config = { project: "tailor-showcase", icons: "icons.svg", skins: ["none", ...skins.map((s) => s.id)], palettes: palettes.map((p) => p.id), modes, labels, defaults: { skin: skins[0]?.id ?? "none", palette: "dracula", mode: "auto" } };

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

  const iconsNav = iconSets.length ? `
        <li class="t-sidebar-group">Icons</li>
        <li><a class="t-sidebar-item" href="#icons"><span class="t-sidebar-item-name">Icon sets</span><span class="t-badge" data-size="xs" data-tone="neutral">${iconSets.length}</span></a></li>` : "";
  const iconsSection = iconSets.length ? `
      <h2 class="sc-group" id="group-icons">Icons</h2>
      <section class="t-card sc-component" id="icons" data-group="icons">
        <div class="t-card-header"><h3 class="t-card-title">Icon sets <code class="sc-id">t-icon</code></h3><a class="sc-only" href="?only=icons" data-only-link title="Show only this section">⤢</a></div>
        <div class="t-card-body">
          <p class="t-muted t-small sc-desc">The adopted sets, a sample of each through the sprite built from them (<code>showcase/icons.svg</code>). Icons inherit <code>currentColor</code>; <code>data-size</code> scales the slot.</p>
          <div class="sc-demo">${iconSets.map((s) => `
            <div class="sc-iconset"><p class="t-small"><b>${esc(s.name)}</b> <span class="t-muted">${esc(s.version)} · ${s.count} icons · ${esc(s.license)} · <code>${esc(s.prefix)}:*</code></span></p>
              <div class="sc-icons">${(s.samples ?? []).map((ref) => { const id = ref.replace(":", "-"); return `<span class="sc-icon" title="${esc(ref)}"><svg class="t-icon" data-size="xl" aria-hidden="true"><use href="icons.svg#${id}"/></svg><code>${esc(ref.split(":")[1])}</code></span>`; }).join("")}</div>
            </div>`).join("")}
          </div>
          <details class="sc-markup"><summary class="t-small">Markup</summary><pre class="t-code-pre"><code>${esc(`<svg class="t-icon" aria-hidden="true"><use href="/tailor/icons.svg#bi-house"/></svg>
<svg class="t-icon" role="img"><title>GitHub</title><use href="/tailor/icons.svg#simple-icons-github"/></svg>`)}</code></pre><p class="t-muted t-small">The sprite is subsetted per project: <code>tailor apply &lt;dir&gt; --icons bi:house,lucide:settings</code> writes <code>public/tailor/icons.svg</code>. See core/conventions.md §2 and docs/icons.md.</p></details>
        </div>
      </section>` : "";

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
  </header>
  <aside class="t-shell-side">
    <nav class="t-sidebar" aria-label="Sections" id="sections-nav">
      <ul>${sideNav}${iconsNav}
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
    <div id="sections">${sections}${iconsSection}
    </div>
  </main>
  <footer class="t-footer t-shell-foot">
    <div class="t-footer-end"><div data-tailor-pickers></div><span class="t-footer-version">tailor ${VERSION} · ${skins.length} skins · ${palettes.length} palettes</span></div>
  </footer>
</div>
<div class="t-toasts" id="t-toasts" aria-live="polite" aria-atomic="false"></div>
<script src="../core/tailor.js" data-tailor="manual"></script>
<script src="showcase.js"></script>
</body>
</html>
`;
}

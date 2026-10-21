// Showcase kit bundle entry (built by bin/build with vite.kit.config.ts into showcase/kit/kit.js + kit.css).
// Exposes window.TailorKit for showcase/showcase.js:
//   mount(root, theme, kit)  — one React root for kit "react" (the tailor-react Ui: tailor markup, every skin).
//                              Every `.sc-demo[data-component-id]` with an island gets a portal rendering that
//                              component through React; the footer pickers ([data-tailor-pickers]) are rendered
//                              by Ui.Pickers. The HTML nodes it replaces are moved aside (not copied), so unmount
//                              puts them back with their tailor.js listeners intact. Returns the ids mounted.
//   update(theme)            — new sprite URL (palette × mode come from the shared theme store, which follows
//                              tailor.js's t:theme events).
//   unmount()                — remove the islands and pickers, put the HTML back.
import { StrictMode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { Ui } from "../../src/index.ts";
import { islandsByKit, islands } from "./islands.tsx";

type Kit = "react";
type Theme = { palette?: string; mode?: "dark" | "light"; /** showcase sprite URL for Ui.Icon (the page resolves it) */ sprite?: string };

// A replaced HTML box: its original child nodes wait in `saved` until unmount.
type Target = { id: string; el: HTMLElement; saved: DocumentFragment };
// Footer pickers: the HTML controls the kit replaces are hidden; one host after the Kit select takes Ui.Pickers
// (kit, skin, palette, mode — the order Tailor.theme.renderPickers uses).
type PickerHosts = { box: HTMLElement; host: HTMLElement; hidden: HTMLElement[]; size: "xs" | "sm" };

let root: Root | null = null;
let targets: Target[] = [];
let pickers: PickerHosts | null = null;
let setTheme: ((t: Theme) => void) | null = null;

function Portals({ kit }: { kit: Kit }) {
  const isl = islandsByKit[kit];
  return (
    <>
      {/* each island recreates the whole demo, wrapper included; the host box takes no part in the layout */}
      {targets.map((t) => createPortal(
        <div className="sc-island" data-kit={kit} style={{ display: "contents" }}>{isl[t.id]}</div>,
        t.el, t.id))}
      {pickers && createPortal(<Ui.Pickers size={pickers.size} />, pickers.host, "pickers")}
    </>
  );
}

function Islands({ initial, kit }: { initial: Theme; kit: Kit }) {
  const [theme, set] = useState(initial);
  useEffect(() => { setTheme = set; return () => { setTheme = null; }; }, []);
  return <Ui.Provider sprite={theme.sprite}><Portals kit={kit} /></Ui.Provider>;
}

function hostPickers(container: ParentNode): PickerHosts | null {
  // the page's own pickers, not the ones inside a demo (the footer demo carries a [data-tailor-pickers] too)
  const box = [...container.querySelectorAll<HTMLElement>("[data-tailor-pickers]")].find((b) => !b.closest(".sc-demo"));
  if (!box) return null;
  const kitWrap = box.querySelector("[data-tailor-picker=kit]")?.closest<HTMLElement>(".t-select-wrap") ?? null;
  const hidden = [...box.children].filter((c): c is HTMLElement => c instanceof HTMLElement && c !== kitWrap && !c.hidden);
  const host = document.createElement("span"); host.className = "sc-kit-pickers"; host.style.display = "contents";
  hidden.forEach((c) => { c.hidden = true; });
  if (kitWrap) kitWrap.after(host); else box.appendChild(host);
  return { box, host, hidden, size: box.closest(".t-footer") ? "xs" : "sm" };
}

function mount(container: ParentNode, theme: Theme, kit: Kit = "react"): string[] {
  unmount();
  const isl = islandsByKit[kit] ?? islandsByKit.react;
  targets = [...container.querySelectorAll<HTMLElement>(".sc-demo[data-component-id]")]
    .filter((el) => isl[el.dataset.componentId ?? ""] !== undefined)
    .map((el) => { const saved = document.createDocumentFragment(); saved.append(...el.childNodes); return { id: el.dataset.componentId!, el, saved }; });
  pickers = hostPickers(container);
  const host = document.createElement("div");
  host.id = "sc-kit-root";
  // zero-size, out of flow: the islands render through portals, so the host must not add height to the document
  host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:visible";
  document.body.appendChild(host);
  root = createRoot(host);
  root.render(<StrictMode><Islands initial={theme} kit={kit} /></StrictMode>);
  return targets.map((t) => t.id);
}

function update(theme: Theme): void { setTheme?.(theme); }

function unmount(): string[] {
  const ids = targets.map((t) => t.id);
  root?.unmount(); root = null;
  document.getElementById("sc-kit-root")?.remove();
  for (const t of targets) { t.el.replaceChildren(t.saved); }
  targets = [];
  if (pickers) { pickers.host.remove(); pickers.hidden.forEach((c) => { c.hidden = false; }); pickers = null; }
  return ids;
}

const api = { mount, update, unmount, islands: Object.keys(islands), kits: Object.keys(islandsByKit) };
declare global { interface Window { TailorKit: typeof api } }
window.TailorKit = api;
export { api as TailorKit };

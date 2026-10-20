// Showcase kit bundle entry (built by bin/build with vite.kit.config.ts into showcase/kit/kit.js + kit.css).
// Exposes window.TailorKit for showcase/showcase.js:
//   mount(root, { palette, mode })  — one React root; every `.sc-demo[data-component-id]` with an island gets a
//                                     portal rendering that component through the Primer kit (its HTML demo is
//                                     saved and restored by unmount). Returns the ids that were mounted.
//   update({ palette, mode })       — re-theme (the page swaps the theme <link>; this keeps ThemeProvider in step).
//   unmount()                       — remove the islands, put the HTML demos back.
// The Primer theme CSS itself (react/adapters/primer/themes/<mode>_<palette>.css) is linked by the page, not
// bundled: 43 files, one at a time.
import "@primer/primitives/dist/css/primitives.css";
import { StrictMode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { BaseStyles, ThemeProvider } from "@primer/react";
import { Ui } from "../../adapters/primer/index.tsx";
import { islands } from "./islands.tsx";

type Theme = { palette: string; mode: "dark" | "light"; /** showcase sprite URL for Ui.Icon (the page resolves it) */ sprite?: string };

// Only colorMode goes to ThemeProvider: the generated theme CSS is selected by the data-*-theme attributes the
// page sets on <html> (same as applyPrimerTheme in adapters/primer/themes/index.ts, which is not imported here
// because that module side-effect-imports all 42 theme files). Naming the scheme would only make Primer's JS
// theme warn that it does not know it.
type Target = { id: string; el: HTMLElement; saved: string };

// Inline demos (several controls side by side, like their HTML demos) sit in a cluster; the rest flow as blocks.
const CLUSTER = new Set(["button", "button-group", "segmented", "menu", "breadcrumb", "badge", "counter", "chip", "state-label", "status-dot", "spinner", "tooltip", "truncate", "relative-time", "help-popover"]);

let root: Root | null = null;
let targets: Target[] = [];
let setTheme: ((t: Theme) => void) | null = null;

function Islands({ initial }: { initial: Theme }) {
  const [theme, set] = useState(initial);
  useEffect(() => { setTheme = set; return () => { setTheme = null; }; }, []);
  return (
    <ThemeProvider colorMode={theme.mode} key={`${theme.mode}_${theme.palette}`}>
      <BaseStyles>
        <Ui.Provider sprite={theme.sprite}>
          {targets.map((t) => createPortal(
            CLUSTER.has(t.id)
              ? <div className="sc-island t-cluster" data-gap="2" data-align="center" data-kit="primer">{islands[t.id]}</div>
              : <div className="sc-island" data-kit="primer">{islands[t.id]}</div>,
            t.el, t.id))}
        </Ui.Provider>
      </BaseStyles>
    </ThemeProvider>
  );
}

function mount(container: ParentNode, theme: Theme): string[] {
  unmount();
  targets = [...container.querySelectorAll<HTMLElement>(".sc-demo[data-component-id]")]
    .filter((el) => islands[el.dataset.componentId ?? ""] !== undefined)
    .map((el) => { const saved = el.innerHTML; el.innerHTML = ""; return { id: el.dataset.componentId!, el, saved }; });
  const host = document.createElement("div");
  host.id = "sc-kit-root";
  // zero-size, out of flow: the islands render through portals, so the host must not add height to the document
  host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:visible";
  document.body.appendChild(host);
  root = createRoot(host);
  root.render(<StrictMode><Islands initial={theme} /></StrictMode>);
  return targets.map((t) => t.id);
}

function update(theme: Theme): void { setTheme?.(theme); }

function unmount(): string[] {
  const ids = targets.map((t) => t.id);
  root?.unmount(); root = null;
  document.getElementById("sc-kit-root")?.remove();
  for (const t of targets) t.el.innerHTML = t.saved;
  targets = [];
  return ids;
}

const api = { mount, update, unmount, islands: Object.keys(islands) };
declare global { interface Window { TailorKit: typeof api } }
window.TailorKit = api;
export { api as TailorKit };

/**
 * The HTML kit runtime. A behaviour is a function that takes over one element marked with data-t="name".
 * Every script file of the kit shares this one registry through the page, so each pack is its own file.
 */

type Behaviour = (element: HTMLElement) => void;

interface Runtime {
  readonly behaviours: Map<string, Behaviour>;
  readonly done: WeakMap<Element, Set<string>>;
  readonly once: Set<string>;
  ids: number;
}

const host = globalThis as { __tailor?: Runtime };
if (!host.__tailor) host.__tailor = { behaviours: new Map(), done: new WeakMap(), once: new Set(), ids: 0 };
const runtime: Runtime = host.__tailor;

function run(element: HTMLElement): void {
  for (const name of (element.dataset.t ?? "").split(/\s+/)) {
    const behaviour = runtime.behaviours.get(name);
    if (!behaviour) continue;
    let applied = runtime.done.get(element);
    if (!applied) {
      applied = new Set();
      runtime.done.set(element, applied);
    }
    if (applied.has(name)) continue;
    applied.add(name);
    try {
      behaviour(element);
    } catch (error) {
      // The element stays as the server wrote it: a native control keeps working.
      console.error(`tailor: "${name}" failed`, error);
    }
  }
}

/** Applies the behaviours to every marked element in the root. Safe to call again. */
export function upgrade(root: ParentNode = document): void {
  if (root instanceof HTMLElement && root.dataset.t) run(root);
  for (const element of root.querySelectorAll<HTMLElement>("[data-t]")) run(element);
}

export function register(name: string, behaviour: Behaviour): void {
  runtime.behaviours.set(name, behaviour);
  if (document.readyState !== "loading") upgrade();
}

/** Runs a setup step once per page, however many script files ask for it. */
export function once(key: string, setup: () => void): void {
  if (runtime.once.has(key)) return;
  runtime.once.add(key);
  setup();
}

/** Makes an element. Attributes with the value undefined or false are left out. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | boolean | undefined> = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    element.setAttribute(name, value === true ? "" : value);
  }
  for (const child of children) if (child !== null && child !== undefined) element.append(child);
  return element;
}

/** A glyph as an element. The body comes from @tailor/core/glyphs.gen. */
export function glyph(body: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "t-icon");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = body;
  return svg;
}

/** An id that no other element of the page has. The count is shared by every script file of the kit. */
export const uid = (prefix: string): string => `${prefix}-${++runtime.ids}`;

const BUSY_ICON = new WeakMap<Element, Element>();

/**
 * Marks a button as busy, as the React Button's `loading` does: a spinner in place of its icon, aria-busy and
 * aria-disabled; the button keeps the focus. `busy(button, false)` puts it back. `Tailor.busy` on the page.
 */
export function busy(button: Element | null, on: boolean): void {
  if (!button) return;
  // A busy button ignores clicks, as the React one does.
  once("busy", () =>
    document.addEventListener(
      "click",
      (event) => {
        if (!(event.target instanceof Element) || !event.target.closest('.t-btn[aria-busy="true"]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true,
    ),
  );
  const spinner = button.querySelector(":scope > .t-btn-spinner");
  if (on) {
    button.setAttribute("aria-busy", "true");
    button.setAttribute("aria-disabled", "true");
    if (spinner) return;
    const next = h("span", { class: "t-btn-spinner", "aria-hidden": "true" });
    const icon = button.querySelector(":scope > svg.t-icon");
    if (icon) {
      BUSY_ICON.set(next, icon);
      icon.replaceWith(next);
    } else button.prepend(next);
    return;
  }
  button.removeAttribute("aria-busy");
  button.removeAttribute("aria-disabled");
  if (!spinner) return;
  const icon = BUSY_ICON.get(spinner);
  if (icon) spinner.replaceWith(icon);
  else spinner.remove();
}

/**
 * The HTML kit runtime. A behaviour is a function that takes over one element marked with data-t="name".
 * Every script file of the kit shares this one registry through the page, so each pack is its own file.
 */

type Behaviour = (element: HTMLElement) => void;

interface Runtime {
  readonly behaviours: Map<string, Behaviour>;
  readonly done: WeakMap<Element, Set<string>>;
  readonly once: Set<string>;
}

const host = globalThis as { __tailor?: Runtime };
if (!host.__tailor) host.__tailor = { behaviours: new Map(), done: new WeakMap(), once: new Set() };
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

let counter = 0;
export const uid = (prefix: string): string =>
  `${prefix}-${++counter}-${Math.random().toString(36).slice(2, 6)}`;

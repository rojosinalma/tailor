/** The PWA store of the page, shared by the pack's scripts and the app: window.Tailor.pwa. */
import { createPwa, type PwaOptions, type PwaStore } from "@tailor/packs/pwa/pwa/client";
import { glyph, h, once } from "../runtime";

declare global {
  interface Window {
    /** Set before the scripts load: { worker: "/sw.js" }. */
    TAILOR_PWA?: PwaOptions;
  }
}

let store: PwaStore | null = null;

export function pwa(): PwaStore {
  if (!store) {
    store = createPwa(window.TAILOR_PWA ?? {});
    window.Tailor = { ...window.Tailor, pwa: store };
  }
  return store;
}

// The worker registers on every page that loads the pack, also one with no PWA element.
once("pwa", pwa);

/** The markup of a Banner with its own glyph and no live role, as the React kit draws it. */
export const notice = (
  tone: "info" | "warning",
  body: string,
  text: string,
  action?: HTMLElement,
): HTMLElement =>
  h(
    "div",
    { class: "t-banner", "data-tone": tone },
    h("span", { class: "t-banner-icon" }, glyph(body)),
    h("div", { class: "t-banner-text" }, text),
    action ? h("div", { class: "t-banner-action" }, action) : null,
  );

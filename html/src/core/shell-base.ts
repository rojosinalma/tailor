import { nextRegion, type ShellForm, shellForm } from "@tailor/packs/core/shell-base/logic";
import { once, register, upgrade } from "../runtime";

const FIELD = "input, textarea, select, [contenteditable]";

const rem = (): number => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The form of a shell from the width of its root: phone, tablet or desktop. */
export const formOf = (root: HTMLElement): ShellForm => shellForm(root.clientWidth, rem());

/** A link that stands in for a button without the script becomes that button, with the link's behaviours (a tooltip). */
export function toButton(link: HTMLAnchorElement): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  for (const { name, value } of link.attributes) if (name !== "href") button.setAttribute(name, value);
  button.append(...link.childNodes);
  link.replaceWith(button);
  upgrade(button);
  return button;
}

/** F6 and Shift+F6 move the focus to the next or the previous visible region (the `regions` under the root). */
export function cycleRegions(root: HTMLElement, regions: string): void {
  root.addEventListener("keydown", (event) => {
    if (event.key !== "F6") return;
    const shown = [...root.querySelectorAll<HTMLElement>(regions)].filter((r) => r.checkVisibility());
    const at = shown.findIndex((r) => r.contains(document.activeElement));
    const next = shown[nextRegion(at, shown.length, event.shiftKey)];
    if (!next) return;
    event.preventDefault();
    next.focus();
  });
}

/** Follows the visual viewport (the on-screen keyboard, the browser bars) in --t-viewport-h on <html>. */
function followViewport(): void {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const update = (): void => {
    document.documentElement.style.setProperty("--t-viewport-h", `${viewport.height + viewport.offsetTop}px`);
    const field = document.activeElement;
    if (field instanceof HTMLElement && field.matches(FIELD)) field.scrollIntoView({ block: "nearest" });
  };
  update();
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
}

/** The phone's search button opens the search as a row under the bar; Escape in an empty field closes it. */
function searchToggle(link: HTMLAnchorElement): void {
  const row = document.getElementById(link.getAttribute("aria-controls") ?? "");
  if (!row) return;
  const button = toButton(link);
  const set = (open: boolean): void => {
    row.toggleAttribute("data-open", open);
    button.setAttribute("aria-expanded", String(open));
  };
  button.addEventListener("click", () => {
    const open = !row.hasAttribute("data-open");
    set(open);
    if (open) row.querySelector<HTMLElement>("input, textarea, select")?.focus();
  });
  // Before the field's own Escape (which clears it first): an empty field closes the row.
  row.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || !row.hasAttribute("data-open")) return;
      if (event.target instanceof HTMLInputElement && event.target.value !== "") return;
      set(false);
      button.focus();
    },
    true,
  );
}

/**
 * Theme controls that the markup leaves without a layout take the compact one while the footer is as narrow
 * as a phone (40rem), so the footer facts keep their width.
 */
function compactWhenNarrow(footer: HTMLElement): void {
  const pickers = [...footer.querySelectorAll<HTMLElement>('[data-t="theme-pickers"]:not([data-layout])')];
  if (pickers.length === 0) return;
  const update = (): void => {
    const narrow = formOf(footer) === "phone";
    for (const element of pickers) {
      if (narrow) element.setAttribute("data-layout", "compact");
      else element.removeAttribute("data-layout");
    }
  };
  update();
  new ResizeObserver(update).observe(footer);
}

/** The frame of a shell: the skip link moves the focus to the main region; a full-screen shell follows the viewport. */
register("shell", (root) => {
  const skip = root.querySelector<HTMLAnchorElement>(":scope > .t-shell-skip");
  skip?.addEventListener("click", (event) => {
    const main = document.getElementById((skip.getAttribute("href") ?? "").slice(1));
    if (!main) return;
    event.preventDefault();
    main.focus();
  });
  for (const link of root.querySelectorAll<HTMLAnchorElement>("a.t-shell-search-button")) searchToggle(link);
  const footer = root.querySelector<HTMLElement>(":scope > .t-shell-footer");
  if (footer) compactWhenNarrow(footer);
  if (!root.hasAttribute("data-contained")) once("shell-viewport", followViewport);
});

import { register } from "../runtime";
import "./dialog";
import { toButton } from "./shell-base";

const SWIPE = 48;

/**
 * The navigation drawer: a <dialog data-t="dialog nav-drawer">. The dialog script opens and closes it;
 * this one turns its opener links into buttons, focuses the first link, and closes on a link or a swipe.
 */
register("nav-drawer", (drawer) => {
  if (!(drawer instanceof HTMLDialogElement) || !drawer.id) return;
  const selector = `[data-t-open="${CSS.escape(drawer.id)}"]`;
  for (const link of document.querySelectorAll<HTMLAnchorElement>(`a${selector}`)) toButton(link);
  const sync = (open: boolean): void => {
    for (const opener of document.querySelectorAll(selector)) {
      opener.setAttribute("aria-expanded", String(open));
    }
  };
  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest(selector)) sync(true);
  });
  drawer.addEventListener("close", () => sync(false));
  drawer.querySelector(".t-shell-nav a[href]")?.setAttribute("autofocus", "");

  drawer.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a[href]")) drawer.close();
  });

  let start: { x: number; y: number } | null = null;
  drawer.addEventListener("pointerdown", (event) => {
    start = { x: event.clientX, y: event.clientY };
  });
  drawer.addEventListener("pointerup", (event) => {
    const from = start;
    start = null;
    if (!from) return;
    const rtl = getComputedStyle(drawer).direction === "rtl";
    const dx = (event.clientX - from.x) * (rtl ? -1 : 1);
    if (dx < -SWIPE && Math.abs(dx) > Math.abs(event.clientY - from.y)) drawer.close();
  });
});

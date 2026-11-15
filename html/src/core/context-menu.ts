import { h, register } from "../runtime";
import { createMenu } from "./menu-items";

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

/** A context menu: `<div data-t="context-menu" data-t-menu="ID">` opens `<div class="t-popup t-menu" id="ID">`. */
register("context-menu", (area) => {
  const panel = document.getElementById(area.dataset.tMenu ?? "");
  if (!panel) return;

  // The menu sits at a point, so its anchor is an empty box there that hands the focus back on close.
  let point = new DOMRect();
  let before: HTMLElement | null = null;
  const anchor = h("span");
  anchor.getBoundingClientRect = () => point;
  anchor.focus = () => (before?.isConnected ? before : area).focus({ preventScroll: true });
  const menu = createMenu(panel, anchor, { gap: 2 });

  const openAt = (x: number, y: number): void => {
    if (menu.isOpen()) menu.close();
    else before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    point = new DOMRect(x, y, 0, 0);
    menu.open();
  };

  // The context-menu key and Shift+F10 also fire contextmenu, at the focused element.
  area.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (!(pressed && menu.isOpen())) openAt(event.clientX, event.clientY);
  });

  // A long press on a touch screen. Some phones also fire contextmenu, which then finds the menu open.
  let timer = 0;
  let start = { x: 0, y: 0 };
  let pressed = false;
  const cancel = (): void => clearTimeout(timer);
  area.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    start = { x: event.clientX, y: event.clientY };
    pressed = false;
    timer = window.setTimeout(() => {
      pressed = true;
      openAt(start.x, start.y);
    }, LONG_PRESS_MS);
  });
  area.addEventListener("pointermove", (event) => {
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_TOLERANCE) cancel();
  });
  area.addEventListener("pointerup", cancel);
  area.addEventListener("pointercancel", cancel);
  // The click that ends a long press is not a click on the area.
  area.addEventListener(
    "click",
    (event) => {
      if (!pressed) return;
      pressed = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
});

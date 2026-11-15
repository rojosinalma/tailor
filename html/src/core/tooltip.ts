import { place } from "@tailor/core/position";
import { h, once, register } from "../runtime";

const DELAY = 600;
const CLOSE_DELAY = 100;

let positioner: HTMLElement | null = null;
let tip: HTMLElement | null = null;
let current: HTMLElement | null = null;
let timer = 0;

/** One tooltip element for the page, made on the first use. */
function layer(): { positioner: HTMLElement; tip: HTMLElement } {
  if (positioner && tip) return { positioner, tip };
  tip = h("div", { class: "t-tooltip" });
  positioner = h("div", { class: "t-tooltip-positioner", role: "presentation", popover: "manual" }, tip);
  // The pointer may move onto the tooltip without closing it.
  positioner.addEventListener("pointerenter", () => clearTimeout(timer));
  positioner.addEventListener("pointerleave", () => later(hide, CLOSE_DELAY));
  document.body.append(positioner);
  return { positioner, tip };
}

const later = (run: () => void, ms: number): void => {
  clearTimeout(timer);
  timer = window.setTimeout(run, ms);
};

function show(target: HTMLElement): void {
  clearTimeout(timer);
  const text = target.dataset.tip;
  if (!text || !target.isConnected) return;
  const { positioner: box, tip: body } = layer();
  current = target;
  body.textContent = text;
  if (!box.matches(":popover-open")) box.showPopover();
  const spot = place(
    target.getBoundingClientRect(),
    { width: box.offsetWidth, height: box.offsetHeight },
    { width: innerWidth, height: innerHeight },
    { side: "top", align: "center", gap: 6 },
  );
  box.style.left = `${spot.x}px`;
  box.style.top = `${spot.y}px`;
  box.dataset.side = spot.side;
}

function hide(): void {
  clearTimeout(timer);
  current = null;
  if (positioner?.matches(":popover-open")) positioner.hidePopover();
}

once("tooltip-escape", () => {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && current) hide();
  });
});

register("tooltip", (element) => {
  element.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") later(() => show(element), DELAY);
  });
  element.addEventListener("pointerleave", () => later(hide, CLOSE_DELAY));
  element.addEventListener("pointerdown", hide);
  element.addEventListener("focus", () => {
    if (element.matches(":focus-visible")) show(element);
  });
  element.addEventListener("blur", hide);
});

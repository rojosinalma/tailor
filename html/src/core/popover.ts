import type { Align, Side } from "@tailor/core/position";
import { createPopup } from "../popup";
import { register } from "../runtime";

const SIDES: readonly string[] = ["top", "bottom", "left", "right"];
const ALIGNS: readonly string[] = ["start", "center", "end"];
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** <button data-t="popover" data-t-popover="ID"> opens <div class="t-popup t-popover" id="ID" hidden>. */
register("popover", (trigger) => {
  const panel = document.getElementById(trigger.dataset.tPopover ?? "");
  if (!panel) return;
  const { side, align } = trigger.dataset;
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", panel.id);
  panel.tabIndex = -1;

  const popup = createPopup(trigger, panel, {
    side: side && SIDES.includes(side) ? (side as Side) : undefined,
    align: align && ALIGNS.includes(align) ? (align as Align) : undefined,
    onClose: () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
      panel.hidden = true;
    },
  });
  const close = (): void => {
    popup.close();
    trigger.focus();
  };

  trigger.addEventListener("click", () => {
    if (popup.isOpen()) return close();
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    popup.open();
    const first = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].find((el) => el.offsetParent !== null);
    (first ?? panel).focus();
  });
  panel.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-t-close]")) close();
  });
  // Focus that leaves for another control closes the popover, as a click outside does.
  panel.addEventListener("focusout", (event) => {
    const to = event.relatedTarget;
    if (to instanceof Node && !popup.positioner.contains(to) && to !== trigger) popup.close();
  });
});

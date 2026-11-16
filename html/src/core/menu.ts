import type { Align } from "@tailor/core/position";
import { register } from "../runtime";
import { createMenu } from "./menu-items";

const ALIGNS: readonly string[] = ["start", "center", "end"];

/** A menu button: `<button data-t="menu" data-t-menu="ID">` opens `<div class="t-popup t-menu" id="ID">`. */
register("menu", (trigger) => {
  const panel = document.getElementById(trigger.dataset.tMenu ?? "");
  if (!panel) return;
  const align = panel.dataset.align ?? "start";
  // data-side="end" opens the menu beside the trigger, on the side where the line ends.
  const rtl = getComputedStyle(trigger).direction === "rtl";
  const side = panel.dataset.side === "end" ? (rtl ? "left" : "right") : "bottom";
  const menu = createMenu(panel, trigger, {
    side,
    align: ALIGNS.includes(align) ? (align as Align) : "start",
    onClose: () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
    },
  });
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-controls", panel.id);

  const open = (focus?: "first" | "last"): void => {
    if (trigger.matches(":disabled, [aria-disabled='true']")) return;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    menu.open(focus);
  };

  // A click from the keyboard (Enter, Space) has no pointer detail: it also focuses the first item.
  trigger.addEventListener("click", (event) => {
    if (menu.isOpen()) menu.close();
    else open(event.detail === 0 ? "first" : undefined);
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    open(event.key === "ArrowDown" ? "first" : "last");
  });
});

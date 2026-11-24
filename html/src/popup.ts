import { type Align, place, type Side } from "@tailor/core/position";
import { h } from "./runtime";

export interface PopupOptions {
  readonly side?: Side;
  readonly align?: Align;
  readonly gap?: number;
  /** Runs after the popup closed, whatever closed it. */
  readonly onClose?: () => void;
}

export interface Popup {
  readonly positioner: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
  /** True for a node in this popup or in a popup opened from it, such as the list of a select in a popover. */
  holds(node: Node): boolean;
}

const PHONE = "(max-width: 40rem)";

/** The positioners of the open popups, the newest last: a popup opened from another one sits above it. */
const stack: HTMLElement[] = [];

/**
 * Shows a panel next to an anchor, in the top layer, kept inside the viewport.
 * A click outside and the Escape key close it. On a phone the stylesheet turns it into a bottom sheet.
 */
export function createPopup(anchor: HTMLElement, panel: HTMLElement, options: PopupOptions = {}): Popup {
  const positioner = h("div", { class: "t-popup-positioner", popover: "manual" }, panel);
  let open = false;

  // A closed popup is out of the page, so aria-controls would name nothing (axe asks for a review). The
  // controls point at the panel or its list only while it is open, as in Base UI; data-t-controls keeps it.
  const point = (on: boolean): void => {
    const ids = new Set([panel, ...panel.querySelectorAll("[id]")].map((el) => el.id).filter(Boolean));
    const from = on ? "data-t-controls" : "aria-controls";
    const to = on ? "aria-controls" : "data-t-controls";
    for (const el of document.querySelectorAll(`[${from}]`)) {
      const value = el.getAttribute(from) ?? "";
      if (!ids.has(value)) continue;
      el.setAttribute(to, value);
      el.removeAttribute(from);
    }
  };
  queueMicrotask(() => {
    if (!open) point(false);
  });

  const update = (): void => {
    if (matchMedia(PHONE).matches) {
      positioner.removeAttribute("style");
      return;
    }
    const rect = anchor.getBoundingClientRect();
    positioner.style.setProperty("--anchor-width", `${rect.width}px`);
    const size = {
      width: panel.offsetWidth,
      height: panel.scrollHeight + (panel.offsetHeight - panel.clientHeight),
    };
    const spot = place(rect, size, { width: innerWidth, height: innerHeight }, options);
    positioner.style.setProperty("--available-height", `${spot.available}px`);
    positioner.style.left = `${spot.x}px`;
    positioner.style.top = `${spot.y}px`;
    positioner.dataset.side = spot.side;
    panel.dataset.side = spot.side;
  };

  const holds = (node: Node): boolean => {
    const at = stack.indexOf(positioner);
    return at < 0 ? positioner.contains(node) : stack.slice(at).some((open) => open.contains(node));
  };
  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (target instanceof Node && (holds(target) || anchor.contains(target))) return;
    close();
  };
  // Escape closes the newest popup only.
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || stack.at(-1) !== positioner) return;
    event.preventDefault();
    close();
    anchor.focus();
  };

  function close(): void {
    if (!open) return;
    open = false;
    stack.splice(stack.indexOf(positioner), 1);
    positioner.hidePopover();
    positioner.remove();
    point(false);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
    removeEventListener("resize", update);
    removeEventListener("scroll", update, true);
    options.onClose?.();
  }

  return {
    positioner,
    open() {
      if (open) return;
      open = true;
      stack.push(positioner);
      document.body.append(positioner);
      point(true);
      positioner.showPopover();
      update();
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeyDown, true);
      addEventListener("resize", update);
      addEventListener("scroll", update, true);
    },
    close,
    isOpen: () => open,
    holds,
  };
}

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
}

const PHONE = "(max-width: 40rem)";

/**
 * Shows a panel next to an anchor, in the top layer, kept inside the viewport.
 * A click outside and the Escape key close it. On a phone the stylesheet turns it into a bottom sheet.
 */
export function createPopup(anchor: HTMLElement, panel: HTMLElement, options: PopupOptions = {}): Popup {
  const positioner = h("div", { class: "t-popup-positioner", popover: "manual" }, panel);
  let open = false;

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

  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (target instanceof Node && (positioner.contains(target) || anchor.contains(target))) return;
    close();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    close();
    anchor.focus();
  };

  function close(): void {
    if (!open) return;
    open = false;
    positioner.hidePopover();
    positioner.remove();
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
      document.body.append(positioner);
      positioner.showPopover();
      update();
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeyDown, true);
      addEventListener("resize", update);
      addEventListener("scroll", update, true);
    },
    close,
    isOpen: () => open,
  };
}

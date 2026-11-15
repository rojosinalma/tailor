/**
 * The open menu: its keyboard, pointer and item handling, shared by menu.ts and context-menu.ts.
 * Not a component of its own.
 */
import type { Align } from "@tailor/core/position";
import { createPopup } from "../popup";

export interface MenuOptions {
  readonly align?: Align;
  readonly gap?: number;
  /** Runs after the menu closed, whatever closed it. */
  readonly onClose?: () => void;
}

export interface OpenMenu {
  /** Opens the menu; "first" or "last" also highlights and focuses that item. */
  open(focus?: "first" | "last"): void;
  close(): void;
  isOpen(): boolean;
}

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const TYPE_AHEAD_MS = 600;

const enabled = (item: Element): boolean => item.getAttribute("aria-disabled") !== "true";

/** Takes over a `t-menu` panel and shows it next to the anchor. */
export function createMenu(panel: HTMLElement, anchor: HTMLElement, options: MenuOptions = {}): OpenMenu {
  panel.hidden = false;
  panel.tabIndex = -1;
  const popup = createPopup(anchor, panel, {
    side: "bottom",
    align: options.align ?? "start",
    gap: options.gap,
    onClose: () => {
      highlight(null);
      options.onClose?.();
    },
  });

  // Disabled items take the highlight too, as in Base UI, but never act.
  const items = (): HTMLElement[] => [...panel.querySelectorAll<HTMLElement>(ITEM)];

  function highlight(item: HTMLElement | null): void {
    for (const other of panel.querySelectorAll(ITEM))
      other.toggleAttribute("data-highlighted", other === item);
    if (item) item.focus({ preventScroll: false });
  }

  const current = (): HTMLElement | null =>
    panel.querySelector<HTMLElement>(`:is(${ITEM})[data-highlighted]`);

  const move = (by: 1 | -1): void => {
    const list = items();
    if (list.length === 0) return;
    const at = list.indexOf(
      current() ?? (by === 1 ? (list.at(-1) as HTMLElement) : (list[0] as HTMLElement)),
    );
    highlight(list[(at + by + list.length) % list.length] ?? null);
  };

  let typed = "";
  let typedAt = 0;
  const typeAhead = (key: string): void => {
    const now = Date.now();
    typed = now - typedAt > TYPE_AHEAD_MS ? key : typed + key;
    typedAt = now;
    const list = items();
    const start = Math.max(0, list.indexOf(current() ?? (list[0] as HTMLElement)));
    // A repeated first letter steps to the next match; a longer string stays on the current match.
    const from = typed.length === 1 ? start + 1 : start;
    const text = (item: HTMLElement): string =>
      (item.querySelector(".t-menu-label")?.textContent ?? "").trim().toLowerCase();
    for (let i = 0; i < list.length; i++) {
      const item = list[(from + i) % list.length];
      if (item && text(item).startsWith(typed.toLowerCase())) {
        highlight(item);
        return;
      }
    }
  };

  panel.addEventListener("keydown", (event) => {
    const { key } = event;
    if (key === "ArrowDown") move(1);
    else if (key === "ArrowUp") move(-1);
    else if (key === "Home") highlight(items()[0] ?? null);
    else if (key === "End") highlight(items().at(-1) ?? null);
    else if (key === "Enter" || key === " ") current()?.click();
    else if (key === "Tab") {
      // The focus goes back to the anchor, and the browser then moves it on from there.
      popup.close();
      anchor.focus();
      return;
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) typeAhead(key);
    else return;
    event.preventDefault();
  });

  panel.addEventListener("pointermove", (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>(ITEM) : null;
    if (item && !item.hasAttribute("data-highlighted")) highlight(item);
  });
  panel.addEventListener("pointerleave", () => {
    const item = current();
    if (item) {
      item.removeAttribute("data-highlighted");
      panel.focus();
    }
  });

  // A disabled item stops the click before the item's own handlers see it.
  panel.addEventListener(
    "click",
    (event) => {
      const item = event.target instanceof Element ? event.target.closest(ITEM) : null;
      if (item && !enabled(item)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  // Runs after the item's own click handlers: the page's code or the link does the action.
  panel.addEventListener("click", (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>(ITEM) : null;
    if (!item) return;
    const role = item.getAttribute("role");
    if (role === "menuitemcheckbox") {
      const checked = item.getAttribute("aria-checked") !== "true";
      item.setAttribute("aria-checked", String(checked));
      return;
    }
    if (role === "menuitemradio") {
      for (const other of item.closest('[role="group"]')?.querySelectorAll('[role="menuitemradio"]') ?? [])
        other.setAttribute("aria-checked", String(other === item));
      return;
    }
    popup.close();
    anchor.focus();
  });

  return {
    open(focus) {
      if (popup.isOpen()) return;
      popup.open();
      const list = items();
      if (focus === "first") highlight(list[0] ?? null);
      else if (focus === "last") highlight(list.at(-1) ?? null);
      else panel.focus();
    },
    close: () => popup.close(),
    isOpen: () => popup.isOpen(),
  };
}

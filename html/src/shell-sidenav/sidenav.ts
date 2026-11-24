import { t } from "@tailor/core/text";
import { formOf } from "../core/shell-base";
import { buildNavDrawer, needsDrawer } from "../nav-drawer-build";
import { h, register } from "../runtime";

interface Stored {
  collapsed?: boolean;
  open?: string[];
}

function readStored(key: string | undefined): Stored {
  if (!key) return {};
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
    if (typeof value !== "object" || value === null) return {};
    const { collapsed, open } = value as Record<string, unknown>;
    return {
      collapsed: typeof collapsed === "boolean" ? collapsed : undefined,
      open: Array.isArray(open) ? open.filter((id): id is string => typeof id === "string") : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * The drawer's navigation from the column's: the same groups and links, without the column's tooltips; a
 * section that opens and closes is its title and its sub-links, all shown, as the React kit draws it.
 */
function drawerNav(column: HTMLElement): HTMLElement {
  const nav = column.cloneNode(true) as HTMLElement;
  for (const el of nav.querySelectorAll(".t-popup, [data-t-menu]")) el.remove();
  for (const el of nav.querySelectorAll("[data-t], [data-tip], [data-tip-side], [aria-describedby]")) {
    for (const name of ["data-t", "data-tip", "data-tip-side", "aria-describedby", "data-t-upgraded"])
      el.removeAttribute(name);
  }
  for (const button of nav.querySelectorAll<HTMLElement>("button.t-shell-link[aria-expanded]")) {
    const title = h(
      "span",
      { class: "t-shell-link" },
      ...[...button.querySelectorAll(":scope > .t-shell-icon, :scope > .t-shell-label")].map((part) =>
        part.cloneNode(true),
      ),
    );
    const sub = button.parentElement?.querySelector<HTMLElement>(":scope > .t-shell-sub");
    if (sub) {
      sub.hidden = false;
      sub.removeAttribute("id");
    }
    button.replaceWith(title);
  }
  return nav;
}

/**
 * The column of the side navigation shell: `<div class="t-shell-sidebar" data-t="sidenav">`. It collapses
 * the column, opens and closes the sections, and remembers both under data-storage-key. On a tablet the column
 * starts collapsed unless the stored state says otherwise or data-tablet-collapsed="off".
 */
register("sidenav", (sidebar) => {
  const root = sidebar.closest<HTMLElement>(".t-shell");
  if (!root) return;
  // The page writes the links once, in the column; the phone's drawer is built from them.
  const column = sidebar.querySelector<HTMLElement>(":scope > .t-shell-nav");
  const bar = sidebar.querySelector<HTMLElement>(":scope > .t-shell-bar");
  if (column && bar && needsDrawer(root)) buildNavDrawer(root, bar, drawerNav(column));
  const key = sidebar.dataset.storageKey;
  const stored = readStored(key);
  const toggle = sidebar.querySelector<HTMLElement>(".t-shell-collapse");
  const links = [...sidebar.querySelectorAll<HTMLElement>('.t-shell-nav a.t-shell-link[data-t~="tooltip"]')];
  const sections = [
    ...sidebar.querySelectorAll<HTMLButtonElement>(
      ".t-shell-nav .t-shell-link[aria-expanded]:not([data-t~='menu'])",
    ),
  ];
  const tablet = sidebar.dataset.tabletCollapsed !== "off" && formOf(root) !== "desktop";
  let collapsed = stored.collapsed ?? tablet;
  const idOf = (button: HTMLElement): string => button.getAttribute("aria-controls") ?? "";
  const isOpen = (button: HTMLElement): boolean => stored.open?.includes(button.dataset.id ?? "") ?? false;

  const save = (): void => {
    if (!key) return;
    const open = sections
      .filter((button) => button.getAttribute("aria-expanded") === "true")
      .map((button) => button.dataset.id ?? "");
    localStorage.setItem(key, JSON.stringify({ collapsed, open }));
  };

  const paint = (): void => {
    root.toggleAttribute("data-collapsed", collapsed);
    const label = collapsed ? t("expandSidebar") : t("collapseSidebar");
    if (toggle) {
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.dataset.tip = label;
    }
    for (const link of links) {
      const text = link.querySelector(".t-shell-label")?.textContent ?? "";
      if (collapsed) link.dataset.tip = text;
      else delete link.dataset.tip;
    }
  };

  const setOpen = (button: HTMLElement, open: boolean): void => {
    button.setAttribute("aria-expanded", String(open));
    const list = document.getElementById(idOf(button));
    if (list) list.hidden = !open;
  };

  for (const button of sections) {
    if (isOpen(button)) setOpen(button, true);
    button.addEventListener("click", () => {
      setOpen(button, button.getAttribute("aria-expanded") !== "true");
      save();
    });
  }
  toggle?.addEventListener("click", () => {
    collapsed = !collapsed;
    paint();
    save();
  });
  paint();
});

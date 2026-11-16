import { t } from "@tailor/core/text";
import { register } from "../runtime";

const TABLET_REM = 64;

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
 * The column of the side navigation shell: `<div class="t-shell-sidebar" data-t="sidenav">`. It collapses
 * the column, opens and closes the sections, and remembers both under data-storage-key.
 */
register("sidenav", (sidebar) => {
  const root = sidebar.closest<HTMLElement>(".t-shell");
  if (!root) return;
  const key = sidebar.dataset.storageKey;
  const stored = readStored(key);
  const toggle = sidebar.querySelector<HTMLElement>(".t-shell-collapse");
  const links = [...sidebar.querySelectorAll<HTMLElement>('.t-shell-nav a.t-shell-link[data-t~="tooltip"]')];
  const sections = [
    ...sidebar.querySelectorAll<HTMLButtonElement>(
      ".t-shell-nav .t-shell-link[aria-expanded]:not([data-t~='menu'])",
    ),
  ];
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  let collapsed = stored.collapsed ?? root.clientWidth <= TABLET_REM * rem;
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

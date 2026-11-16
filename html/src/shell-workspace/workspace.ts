import { chevronDown, chevronUp } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  lengthToPx,
  nextRegion,
  parseLayout,
  resizeByKey,
  resizeByPointer,
  SIZE_TOKENS,
  type SplitBounds,
  type WorkspaceLayout,
  type WorkspaceSide,
} from "@tailor/packs/shell-workspace/workspace/logic";
import { glyph, register } from "../runtime";

const PHONE_REM = 40;
const TABLET_REM = 64;
const REGIONS =
  ":scope > :is(.t-shell-bar, .t-shell-sidebar, .t-shell-main, .t-workspace-panel, .t-workspace-bottom)";

const rem = (): number => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

function formOf(root: HTMLElement): "desktop" | "tablet" | "phone" {
  const width = root.clientWidth / rem();
  return width <= PHONE_REM ? "phone" : width <= TABLET_REM ? "tablet" : "desktop";
}

/** A link that stands in for a button without the script becomes that button. */
function toButton(link: HTMLAnchorElement): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  for (const { name, value } of link.attributes) if (name !== "href") button.setAttribute(name, value);
  button.append(...link.childNodes);
  link.replaceWith(button);
  return button;
}

/** Puts the nodes at the end of `to`, before its resize handle. */
function moveInto(to: Element, nodes: Node[]): void {
  const handle = to.querySelector(":scope > .t-workspace-handle");
  if (handle) handle.before(...nodes);
  else to.append(...nodes);
}

/**
 * The workspace shell: `<div class="t-shell" data-shell="workspace" data-t="shell workspace">`. It collapses
 * the sidebar and the bottom panel, switches the right panels, resizes the regions, remembers the layout
 * under data-storage-key, moves F6 between the regions, and on a phone moves each region into its sheet.
 */
register("workspace", (root) => {
  const key = root.dataset.storageKey;
  let layout: WorkspaceLayout = {};
  try {
    layout = key ? parseLayout(localStorage.getItem(key)) : {};
  } catch {
    // Blocked storage: the shell starts as written.
  }
  for (const link of root.querySelectorAll<HTMLAnchorElement>(
    "a.t-btn[data-t-open], .t-workspace-rail > a.t-btn, a.t-btn[data-workspace-close]",
  ))
    toButton(link);
  root.setAttribute("data-ready", "");

  const bar = root.querySelector<HTMLElement>(":scope > .t-shell-bar");
  const left = root.querySelector<HTMLElement>(":scope > .t-shell-sidebar");
  const toggle = bar?.querySelector<HTMLElement>(".t-shell-collapse");
  const panels = [...root.querySelectorAll<HTMLElement>(":scope > .t-workspace-panel")];
  const rail = [...root.querySelectorAll<HTMLElement>(".t-workspace-rail > .t-btn")];
  const bottom = root.querySelector<HTMLElement>(":scope > .t-workspace-bottom");
  const bottomBody = bottom?.querySelector<HTMLElement>(".t-workspace-bottom-body");
  const bottomToggle = bottomBody
    ? bottom?.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(bottomBody.id)}"]`)
    : null;
  const idOf = (panel: HTMLElement): string => panel.dataset.panel ?? "";
  const style = getComputedStyle(root);
  const bounds = (side: WorkspaceSide): SplitBounds & { start: number } => {
    const [min, start, max] = SIZE_TOKENS[side].map((token) =>
      lengthToPx(style.getPropertyValue(token), rem()),
    ) as [number, number, number];
    return { min, start, max };
  };

  const first = formOf(root);
  let collapsed = layout.leftCollapsed ?? first !== "desktop";
  const startPanel = panels.find((p) => p.hasAttribute("data-open"));
  // A tablet or a phone starts with the default panel closed: it would lie over the centre.
  const fallback = startPanel && first === "desktop" ? idOf(startPanel) : null;
  let open = layout.panel === undefined ? fallback : layout.panel;
  if (!panels.some((p) => idOf(p) === open)) open = null;
  let bottomCollapsed = layout.bottomCollapsed ?? false;

  const save = (patch: WorkspaceLayout): void => {
    layout = { ...layout, ...patch };
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(layout));
    } catch {
      // Storage can be full or blocked; the layout then lasts for this page only.
    }
  };

  const paint = (): void => {
    root.toggleAttribute("data-left-collapsed", left !== null && collapsed);
    if (toggle) {
      const label = collapsed ? t("expandSidebar") : t("collapseSidebar");
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.dataset.tip = label;
    }
    for (const panel of panels) panel.toggleAttribute("data-open", idOf(panel) === open);
    for (const button of rail) {
      const panel = document.getElementById(button.getAttribute("aria-controls") ?? "");
      button.setAttribute("aria-pressed", String(panel !== null && idOf(panel) === open));
    }
    root.toggleAttribute("data-bottom-collapsed", bottom !== null && bottomCollapsed);
    if (bottomToggle) {
      bottomToggle.setAttribute("aria-expanded", String(!bottomCollapsed));
      bottomToggle.setAttribute("aria-label", bottomCollapsed ? t("expandPanel") : t("collapsePanel"));
      bottomToggle.replaceChildren(glyph(bottomCollapsed ? chevronUp : chevronDown));
    }
  };

  const setPanel = (id: string | null): void => {
    open = id;
    save({ panel: id });
    paint();
  };
  const closePanel = (panel: HTMLElement): void => {
    setPanel(null);
    rail.find((b) => b.getAttribute("aria-controls") === panel.id)?.focus();
  };

  toggle?.addEventListener("click", () => {
    collapsed = !collapsed;
    save({ leftCollapsed: collapsed });
    paint();
  });
  for (const button of rail) {
    button.addEventListener("click", () => {
      const panel = document.getElementById(button.getAttribute("aria-controls") ?? "");
      if (panel) setPanel(open === idOf(panel) ? null : idOf(panel));
    });
  }
  for (const panel of panels) {
    panel
      .querySelector(".t-workspace-panel-header > .t-btn")
      ?.addEventListener("click", () => closePanel(panel));
  }
  bottomToggle?.addEventListener("click", () => {
    bottomCollapsed = !bottomCollapsed;
    save({ bottomCollapsed });
    paint();
  });

  // Escape closes a region that lies over the centre: a floating panel, the tablet's sidebar.
  const escapes = (region: HTMLElement, close: () => void): void => {
    region.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (getComputedStyle(region).position !== "absolute") return;
      event.preventDefault();
      close();
    });
  };
  for (const panel of panels) escapes(panel, () => closePanel(panel));
  if (left)
    escapes(left, () => {
      collapsed = true;
      save({ leftCollapsed: true });
      paint();
      toggle?.focus();
    });

  // The sizes: a custom property on the root per region, and the value of its handle.
  for (const handle of root.querySelectorAll<HTMLElement>(":scope > * > .t-workspace-handle")) {
    const side = handle.dataset.side as WorkspaceSide;
    const region = handle.parentElement;
    if (!region || !(side in SIZE_TOKENS)) continue;
    const limits = bounds(side);
    let size = layout[side] ?? limits.start;
    handle.setAttribute("aria-valuemin", String(Math.round(limits.min)));
    handle.setAttribute("aria-valuemax", String(Math.round(limits.max)));
    const apply = (next: number, done: boolean): void => {
      size = next;
      root.style.setProperty(`--t-workspace-${side}`, `${size}px`);
      handle.setAttribute("aria-valuenow", String(Math.round(size)));
      if (done) save({ [side]: size });
    };
    if (layout[side] !== undefined) apply(size, false);
    else handle.setAttribute("aria-valuenow", String(Math.round(size)));

    handle.addEventListener("keydown", (event) => {
      const next = resizeByKey(side, event.key, size, limits, rem());
      if (next === null) return;
      event.preventDefault();
      apply(next, true);
    });
    const fromPointer = (event: PointerEvent): number => {
      const box = region.getBoundingClientRect();
      if (side === "left") return resizeByPointer(side, event.clientX, box.left, limits);
      if (side === "right") return resizeByPointer(side, event.clientX, box.right, limits);
      return resizeByPointer(side, event.clientY, box.bottom, limits);
    };
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      handle.setAttribute("data-dragging", "");
    });
    handle.addEventListener("pointermove", (event) => {
      if (handle.hasAttribute("data-dragging")) apply(fromPointer(event), false);
    });
    const end = (event: PointerEvent): void => {
      if (!handle.hasAttribute("data-dragging")) return;
      handle.removeAttribute("data-dragging");
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      apply(fromPointer(event), true);
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  // F6 and Shift+F6 move the focus from region to region.
  root.addEventListener("keydown", (event) => {
    if (event.key !== "F6") return;
    const regions = [...root.querySelectorAll<HTMLElement>(REGIONS)].filter((r) => r.checkVisibility());
    const at = regions.findIndex((r) => r.contains(document.activeElement));
    const next = regions[nextRegion(at, regions.length, event.shiftKey)];
    if (!next) return;
    event.preventDefault();
    next.focus();
  });

  // The phone: each region's content moves into its sheet, and back on a wider screen.
  const sheet = (selector: string): HTMLElement | null =>
    bar?.querySelector<HTMLElement>(`.t-workspace-sheet${selector}`) ?? null;
  const moves: [HTMLElement, HTMLElement][] = [];
  const leftSheet = sheet('[data-region="left"]');
  if (left && leftSheet) moves.push([left, leftSheet]);
  for (const panel of panels) {
    const body = panel.querySelector<HTMLElement>(".t-workspace-panel-body");
    const target = sheet(`[data-panel="${CSS.escape(idOf(panel))}"]`);
    if (body && target) moves.push([body, target]);
  }
  const bottomSheet = sheet('[data-region="bottom"]');
  if (bottomBody && bottomSheet) moves.push([bottomBody, bottomSheet]);
  const actions = bottom?.querySelector<HTMLElement>(".t-workspace-bottom-header > .t-workspace-actions");
  const sheetActions = bottomSheet?.closest("dialog")?.querySelector<HTMLElement>(".t-workspace-actions");
  if (actions && sheetActions) moves.push([actions, sheetActions]);

  let phone = false;
  const place = (): void => {
    const now = formOf(root) === "phone";
    if (now === phone) return;
    phone = now;
    for (const [home, target] of moves) {
      target.closest("dialog")?.close();
      const [from, to] = phone ? [home, target] : [target, home];
      moveInto(
        to,
        [...from.childNodes].filter((n) => !(n instanceof Element && n.matches(".t-workspace-handle"))),
      );
    }
  };
  place();
  new ResizeObserver(place).observe(root);

  // Choosing a link in the navigation sheet closes it.
  leftSheet?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a[href]"))
      leftSheet.closest("dialog")?.close();
  });

  // More than two panels: the "Panels" menu opens the chosen panel's sheet.
  const menuId = bar?.querySelector<HTMLElement>(".t-workspace-phone[data-t-menu]")?.dataset.tMenu;
  if (menuId)
    document.addEventListener("click", (event) => {
      const item = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-id]") : null;
      if (!item?.closest(`#${CSS.escape(menuId)}`)) return;
      const dialog = sheet(`[data-panel="${CSS.escape(item.dataset.id ?? "")}"]`)?.closest("dialog");
      if (dialog && !dialog.open) dialog.showModal();
    });

  paint();
});

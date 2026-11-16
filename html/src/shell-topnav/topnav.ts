import { THEME_EVENT } from "@tailor/core/theme";
import { fit } from "@tailor/packs/shell-topnav/topnav/logic";
import { register } from "../runtime";

/**
 * The row of a top bar: `<nav data-t="topnav">`. The links that do not fit hide and their entries show in the
 * "More" menu, whose panel holds one entry per link in the same order. Without the script the row scrolls.
 */
register("topnav", (nav) => {
  const row = nav.querySelector<HTMLElement>(":scope > .t-shell-list");
  const more = row?.querySelector<HTMLElement>(":scope > .t-topnav-more");
  const panel = more
    ? document.getElementById(more.querySelector("[data-t-menu]")?.getAttribute("data-t-menu") ?? "")
    : null;
  if (!row || !more || !panel) return;
  const items = [...row.querySelectorAll<HTMLElement>(":scope > [data-index]")];
  const entries = [...panel.children];
  const currentIndex = items.findIndex((el) =>
    el.querySelector('[aria-current="page"], [data-current-section]'),
  );

  const update = (): void => {
    for (const el of [...items, more]) el.hidden = false;
    const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
    const widths = items.map((el) => el.getBoundingClientRect().width + gap);
    const shown = new Set(
      fit(widths, row.clientWidth + gap, more.getBoundingClientRect().width + gap, currentIndex),
    );
    items.forEach((el, i) => {
      el.hidden = !shown.has(i);
    });
    more.hidden = shown.size === items.length;
    panel.replaceChildren(...entries.filter((_, i) => !shown.has(i)));
  };

  nav.setAttribute("data-t-upgraded", "");
  update();
  new ResizeObserver(update).observe(nav);
  new MutationObserver(update).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-skin", "class"],
  });
  document.addEventListener(THEME_EVENT, update);
  void document.fonts?.ready.then(update);
});

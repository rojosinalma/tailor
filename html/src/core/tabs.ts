import { register } from "../runtime";

/** Scrolls the list sideways, never the page, until the tab is in view. */
function reveal(list: HTMLElement, tab: HTMLElement): void {
  const box = list.getBoundingClientRect();
  const item = tab.getBoundingClientRect();
  if (item.left < box.left) list.scrollLeft += item.left - box.left;
  else if (item.right > box.right) list.scrollLeft += item.right - box.right;
}

/** Tabs: the server writes every panel visible, so the page still works when this script fails. */
register("tabs", (root) => {
  const list = root.querySelector<HTMLElement>(':scope > [role="tablist"]');
  if (!list) return;
  const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
  const enabled = (tab: HTMLElement): boolean => tab.getAttribute("aria-disabled") !== "true";
  const panelOf = (tab: HTMLElement): HTMLElement | null =>
    document.getElementById(tab.getAttribute("aria-controls") ?? "");

  const select = (chosen: HTMLElement): void => {
    for (const tab of tabs) {
      const on = tab === chosen;
      tab.setAttribute("aria-selected", String(on));
      tab.toggleAttribute("data-active", on);
      tab.tabIndex = on ? 0 : -1;
      const panel = panelOf(tab);
      if (panel) panel.hidden = !on;
    }
    reveal(list, chosen);
  };

  const focus = (tab: HTMLElement): void => {
    for (const other of tabs) other.tabIndex = other === tab ? 0 : -1;
    tab.focus();
  };

  list.addEventListener("click", (event) => {
    const tab = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="tab"]') : null;
    if (tab && tabs.includes(tab) && enabled(tab)) select(tab);
  });

  list.addEventListener("keydown", (event) => {
    const current = event.target;
    if (!(current instanceof HTMLElement) || !tabs.includes(current)) return;
    // As in Base UI, a disabled tab takes the focus but never shows its panel.
    const at = tabs.indexOf(current);
    const rtl = getComputedStyle(list).direction === "rtl";
    let next: HTMLElement | undefined;
    if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = tabs[(at + 1) % tabs.length];
    else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft"))
      next = tabs[(at - 1 + tabs.length) % tabs.length];
    else if (event.key === "Home") next = tabs[0];
    else if (event.key === "End") next = tabs.at(-1);
    if (!next) return;
    event.preventDefault();
    focus(next);
  });

  const first = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs.find(enabled);
  if (!first) return;
  select(first);
  // Until another tab is chosen, the first tab stays in view from the start of the row whenever the sizes
  // change (fonts, skin, width), as in the React kit.
  const observer = new ResizeObserver(() => {
    if (first.getAttribute("aria-selected") !== "true") return observer.disconnect();
    list.scrollLeft = 0;
    reveal(list, first);
  });
  observer.observe(list);
  observer.observe(first);
});

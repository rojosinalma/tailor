import { chevronDown, close, menu } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { THEME_EVENT } from "@tailor/core/theme";
import { fit } from "@tailor/packs/shell-topnav/topnav/logic";
import { glyph, h, register, uid, upgrade } from "../runtime";

/** The parts of one link of the bar: a link, or a section (a menu button with its menu of sub-links). */
interface BarItem {
  readonly item: HTMLElement;
  readonly link: HTMLAnchorElement | null;
  readonly section: { readonly button: HTMLElement; readonly entries: HTMLAnchorElement[] } | null;
}

const iconOf = (el: Element | null | undefined): Node | null =>
  el?.querySelector(".t-shell-icon > svg, .t-menu-icon > svg")?.cloneNode(true) ?? null;
const labelOf = (el: Element): string =>
  (el.querySelector(".t-shell-label, .t-menu-label")?.textContent ?? el.textContent ?? "").trim();

function readItem(item: HTMLElement): BarItem {
  const link = item.querySelector<HTMLAnchorElement>(":scope > a.t-shell-link");
  const button = item.querySelector<HTMLElement>(":scope > [data-t-menu]");
  const panel = button ? document.getElementById(button.getAttribute("data-t-menu") ?? "") : null;
  const entries = panel ? [...panel.querySelectorAll<HTMLAnchorElement>("a[href]")] : [];
  return { item, link, section: button ? { button, entries } : null };
}

/** One entry of a menu, as the React kit's Menu draws a link. */
function menuEntry(from: Element, href: string): HTMLAnchorElement {
  const icon = iconOf(from);
  return h(
    "a",
    { href, class: "t-option t-menu-item", role: "menuitem", tabindex: "-1" },
    icon ? h("span", { class: "t-menu-icon" }, icon) : null,
    h("span", { class: "t-menu-label" }, labelOf(from)),
  );
}

/** The entries of "More" for one link of the bar: the link, or the section as a group of its sub-links. */
function moreEntry({ link, section }: BarItem): HTMLElement | null {
  if (link) return menuEntry(link, link.getAttribute("href") ?? "");
  if (!section) return null;
  const id = uid("t-menu-group");
  return h(
    "div",
    { class: "t-menu-group", role: "group", "aria-labelledby": id },
    h("div", { class: "t-menu-group-label", id }, labelOf(section.button)),
    ...section.entries.map((entry) => menuEntry(entry, entry.getAttribute("href") ?? "")),
  );
}

/** "More" at the end of the row, with one entry per link of the bar. */
function buildMore(row: HTMLElement, items: readonly BarItem[]): HTMLElement {
  const id = uid("t-menu");
  const more = h(
    "li",
    { class: "t-topnav-more", hidden: true },
    h(
      "button",
      {
        type: "button",
        class: "t-shell-link",
        "data-t": "menu",
        "data-t-menu": id,
        "aria-haspopup": "menu",
        "aria-expanded": "false",
      },
      h("span", { class: "t-shell-label" }, t("more")),
      h("span", { class: "t-shell-chevron" }, glyph(chevronDown)),
    ),
    h(
      "div",
      {
        class: "t-popup t-menu",
        id,
        role: "menu",
        "aria-label": t("more"),
        "data-align": "end",
        hidden: true,
      },
      ...items.map(moreEntry),
    ),
  );
  row.append(more);
  return more;
}

/** A link of the drawer, as the React kit's navigation lists draw it. */
function drawerLink(from: Element): HTMLLIElement {
  const copy = from.cloneNode(true) as HTMLElement;
  const link = h("a", { href: from.getAttribute("href") ?? "", class: "t-shell-link" });
  const current = from.getAttribute("aria-current");
  if (current) link.setAttribute("aria-current", current);
  const icon = iconOf(from);
  if (icon) link.append(h("span", { class: "t-shell-icon" }, icon));
  link.append(h("span", { class: "t-shell-label" }, labelOf(from)));
  const counter = copy.querySelector(".t-counter");
  if (counter) link.append(counter);
  return h("li", {}, link);
}

/**
 * The navigation drawer of a phone, from the links of the bar, the brand and the shell's footer: the menu
 * button and the <dialog> that the core scripts then take over.
 */
function buildDrawer(shell: HTMLElement, bar: HTMLElement, items: readonly BarItem[]): void {
  const id = uid("t-nav-drawer");
  const brand = bar.querySelector(":scope > .t-shell-brand")?.cloneNode(true) ?? null;
  const list = h(
    "ul",
    { class: "t-shell-list" },
    ...items.map(({ link, section }) => {
      if (link) return drawerLink(link);
      if (!section) return null;
      const icon = iconOf(section.button);
      return h(
        "li",
        {},
        h(
          "span",
          { class: "t-shell-link" },
          icon ? h("span", { class: "t-shell-icon" }, icon) : null,
          h("span", { class: "t-shell-label" }, labelOf(section.button)),
        ),
        h("ul", { class: "t-shell-sub" }, ...section.entries.map(drawerLink)),
      );
    }),
  );
  const footer = shell.querySelector(":scope > .t-shell-footer");
  const facts = footer?.querySelector(".t-shell-facts")?.cloneNode(true) ?? null;
  const pickers = footer?.querySelector<HTMLElement>(".t-theme-pickers");
  const theme = pickers
    ? h(
        "div",
        { class: "t-shell-theme" },
        h("div", {
          class: "t-theme-pickers",
          "data-t": "theme-pickers",
          "data-parts": pickers.dataset.parts,
          "data-layout": "compact",
        }),
      )
    : null;
  const drawer = h(
    "dialog",
    {
      class: "t-drawer t-nav-drawer",
      id,
      "data-t": "dialog nav-drawer",
      "data-side": "start",
      "aria-label": t("menu"),
    },
    h(
      "header",
      { class: "t-drawer-header" },
      brand,
      h(
        "button",
        { type: "button", class: "t-drawer-close", "aria-label": t("close"), "data-t-close": "" },
        glyph(close),
      ),
    ),
    h(
      "div",
      { class: "t-drawer-body t-nav-drawer-body" },
      h(
        "nav",
        { class: "t-shell-nav", "aria-label": t("mainNavigation") },
        h("div", { class: "t-shell-group" }, list),
      ),
    ),
    facts || theme ? h("div", { class: "t-nav-drawer-footer" }, facts, theme) : null,
  );
  const button = h(
    "a",
    {
      class: "t-btn t-shell-menu-button",
      "data-variant": "ghost",
      "data-icon-only": "",
      href: `#${id}`,
      "data-t-open": id,
      "aria-label": t("menu"),
      "aria-controls": id,
      "aria-expanded": "false",
    },
    glyph(menu),
  );
  bar.prepend(button, drawer);
  upgrade(drawer);
  upgrade(bar);
}

/**
 * The row of a top bar: `<nav data-t="topnav">`. The page writes the links once, in the bar's list; the script
 * builds the "More" menu and the phone's navigation drawer from them when the markup has none (markup that has
 * them keeps them). The links that do not fit hide and their entries show in "More", whose panel holds one
 * entry per link in the same order. Without the script the row scrolls.
 */
register("topnav", (nav) => {
  const row = nav.querySelector<HTMLElement>(":scope > .t-shell-list");
  if (!row) return;
  const items = [...row.querySelectorAll<HTMLElement>(":scope > li:not(.t-topnav-more)")];
  const bar = nav.closest<HTMLElement>(".t-shell-bar");
  const shell = nav.closest<HTMLElement>(".t-shell");
  if (bar && shell && !shell.querySelector(".t-nav-drawer, .t-bottom-bar"))
    buildDrawer(shell, bar, items.map(readItem));
  const built =
    row.querySelector<HTMLElement>(":scope > .t-topnav-more") ?? buildMore(row, items.map(readItem));
  const more = built;
  // The panel is found before the menu script takes it over and moves it out of the row.
  const panel = document.getElementById(
    more.querySelector("[data-t-menu]")?.getAttribute("data-t-menu") ?? "",
  );
  upgrade(more);
  if (!panel) return;
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

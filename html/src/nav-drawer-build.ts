/**
 * The navigation drawer of a phone, built from links that the page wrote once (the top bar's list, the side
 * column's groups): the menu button and the <dialog> that the core scripts then take over. Shared by the
 * shell scripts; the markup of 2.2.0, which holds the drawer itself, needs none of it.
 */
import { close, menu } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { glyph, h, uid, upgrade } from "./runtime";

/** True when the shell's markup has no phone navigation of its own: no drawer and no bottom bar. */
export const needsDrawer = (shell: Element): boolean => !shell.querySelector(".t-nav-drawer, .t-bottom-bar");

/**
 * Puts the menu button and the drawer at the start of `bar`. The drawer holds the brand of the bar, `nav` (a
 * `<nav class="t-shell-nav">` in the drawer's form), and the facts and theme controls of the shell's footer.
 */
export function buildNavDrawer(shell: HTMLElement, bar: HTMLElement, nav: HTMLElement): void {
  const id = uid("t-nav-drawer");
  const brand = bar.querySelector(":scope > .t-shell-brand")?.cloneNode(true) ?? null;
  const footer = [...shell.querySelectorAll(".t-shell-footer")].find((f) => !f.closest("dialog"));
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
  nav.setAttribute("aria-label", t("mainNavigation"));
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
    h("div", { class: "t-drawer-body t-nav-drawer-body" }, nav),
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

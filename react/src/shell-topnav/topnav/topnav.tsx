import { chevronDown } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { THEME_EVENT } from "@tailor/core/theme";
import { holdsCurrent, isCurrent } from "@tailor/packs/core/shell-base/logic";
import { fit } from "@tailor/packs/shell-topnav/topnav/logic";
import type spec from "@tailor/packs/shell-topnav/topnav/spec";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { BottomBar } from "../../core/bottom-bar/bottom-bar";
import { Icon } from "../../core/icon/icon";
import { Menu, type MenuActionItem, type MenuItem } from "../../core/menu/menu";
import { NavDrawer, useNavDrawer } from "../../core/nav-drawer/nav-drawer";
import {
  NavContent,
  type NavItem,
  NavLink,
  ShellActions,
  ShellBar,
  ShellBrandLink,
  type ShellCommon,
  ShellFooter,
  ShellMain,
  ShellRoot,
  useCurrentPath,
} from "../../core/shell-base/shell-base";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface TopNavShellProps extends ShellCommon {
  /** The links of the bar, in order. One level of sub-items opens a menu. */
  nav: NavItem[];
  /** The navigation on a phone: the drawer behind the menu button, or a bar at the bottom. Default "drawer". */
  phoneNav?: (typeof spec.props.phoneNav)[number];
}

const asAction = (item: NavItem): MenuActionItem => ({
  id: item.id,
  label: item.label,
  icon: item.icon ? <Icon name={item.icon} /> : undefined,
  to: item.to,
});

/** A link of the row as menu entries: a link, or a section as a group of its sub-items. */
const asMenuItem = (item: NavItem): MenuItem =>
  item.items?.length ? { type: "group", label: item.label, items: item.items.map(asAction) } : asAction(item);

function RowItem({ item, path }: { item: NavItem; path: string | null }) {
  if (!item.items?.length) return <NavLink item={item} path={path} />;
  const section = holdsCurrent(item, path);
  return (
    <Menu
      label={item.label}
      items={item.items.map(asAction)}
      trigger={
        <button type="button" className="t-shell-link" data-current-section={section ? "" : undefined}>
          <NavContent item={item} chevron />
        </button>
      }
    />
  );
}

/** Measures the row and hides the links that do not fit; they show in "More". Before paint, so nothing jumps. */
function useFit(nav: readonly NavItem[], path: string | null) {
  const list = useRef<HTMLUListElement>(null);
  const [hidden, setHidden] = useState<readonly number[]>([]);
  const currentIndex = nav.findIndex((item) => isCurrent(item, path) || holdsCurrent(item, path));

  useLayoutEffect(() => {
    const row = list.current;
    if (!row) return;
    const update = (): void => {
      const items = [...row.querySelectorAll<HTMLElement>(":scope > [data-index]")];
      const more = row.querySelector<HTMLElement>(":scope > .t-topnav-more");
      if (!more) return;
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
      const next = items.map((_, i) => i).filter((i) => !shown.has(i));
      setHidden((before) => (before.join() === next.join() ? before : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row.parentElement ?? row);
    // A skin, a palette or a font changes the widths of the links without a resize of the row.
    const page = new MutationObserver(update);
    page.observe(document.documentElement, { attributes: true, attributeFilter: ["data-skin", "class"] });
    document.addEventListener(THEME_EVENT, update);
    void document.fonts?.ready.then(update);
    return () => {
      observer.disconnect();
      page.disconnect();
      document.removeEventListener(THEME_EVENT, update);
    };
  }, [currentIndex]);

  return { list, hidden };
}

function Row({ nav, path }: { nav: readonly NavItem[]; path: string | null }) {
  const isStatic = useIsStatic();
  const { list, hidden } = useFit(nav, path);
  const overflow = isStatic ? nav : hidden.flatMap((i) => (nav[i] ? [nav[i]] : []));
  if (nav.length === 0) return null;
  return (
    <nav className="t-shell-nav" aria-label={t("mainNavigation")} data-t={isStatic ? "topnav" : undefined}>
      <ul className="t-shell-list" ref={list}>
        {nav.map((item, i) => (
          <li key={item.id} data-index={i}>
            <RowItem item={item} path={path} />
          </li>
        ))}
        <li className="t-topnav-more" hidden={isStatic || undefined}>
          <Menu
            label={t("more")}
            align="end"
            items={overflow.map(asMenuItem)}
            trigger={
              <button type="button" className="t-shell-link">
                <span className="t-shell-label">{t("more")}</span>
                <span className="t-shell-chevron">
                  <Glyph body={chevronDown} />
                </span>
              </button>
            }
          />
        </li>
      </ul>
    </nav>
  );
}

/** The top navigation shell: brand, links and actions in a top bar; a Page in the content region. */
export function TopNavShell({
  brand,
  nav,
  actions,
  footer = [],
  theme,
  phoneNav = "drawer",
  contained,
  children,
}: TopNavShellProps) {
  const main = useId();
  const drawer = useNavDrawer();
  const path = useCurrentPath();
  const drawerProps = { brand, nav, footer, theme, control: drawer };
  return (
    <ShellRoot shell="topnav" mainId={main} contained={contained}>
      <ShellBar>
        {phoneNav === "drawer" ? <NavDrawer {...drawerProps} /> : null}
        <ShellBrandLink brand={brand} />
        <Row nav={nav} path={path} />
        <ShellActions>{actions}</ShellActions>
      </ShellBar>
      <ShellMain id={main}>{children}</ShellMain>
      <ShellFooter facts={footer} theme={theme} />
      {phoneNav === "bar" ? (
        <>
          <BottomBar items={nav} drawer={drawer} />
          <NavDrawer {...drawerProps} button={false} />
        </>
      ) : null}
    </ShellRoot>
  );
}

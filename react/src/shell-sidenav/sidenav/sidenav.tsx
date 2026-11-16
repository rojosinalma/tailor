import { sidebar } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { holdsCurrent, toGroups } from "@tailor/packs/core/shell-base/logic";
import type spec from "@tailor/packs/shell-sidenav/sidenav/spec";
import { useCallback, useId, useLayoutEffect, useState } from "react";
import { BottomBar } from "../../core/bottom-bar/bottom-bar";
import { Button } from "../../core/button/button";
import { Icon } from "../../core/icon/icon";
import { Menu, type MenuActionItem } from "../../core/menu/menu";
import { NavDrawer, useNavDrawer } from "../../core/nav-drawer/nav-drawer";
import {
  firstLevel,
  NavContent,
  type NavGroup,
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
import { Tooltip } from "../../core/tooltip/tooltip";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface SideNavShellProps extends ShellCommon {
  /** The links in groups. A plain list of items is one group without a label. */
  nav: NavGroup[] | NavItem[];
  /** The navigation on a phone: the drawer behind the menu button, or a bar at the bottom. Default "drawer". */
  phoneNav?: (typeof spec.props.phoneNav)[number];
  /** Where the collapsed state and the open sections are remembered (localStorage). Default "tailor.sidenav"; `false` remembers nothing. */
  storageKey?: string | false;
}

interface Stored {
  collapsed?: boolean;
  open?: string[];
}

const DEFAULT_KEY = "tailor.sidenav";
/** A column narrower than this, a tablet, starts collapsed. */
const TABLET_REM = 64;

function readStored(key: string | false): Stored {
  if (key === false || typeof localStorage === "undefined") return {};
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

const isTablet = (root: HTMLElement): boolean =>
  root.clientWidth <= TABLET_REM * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The collapsed state and the open sections, read once and written on every change. */
function useSidebarState(key: string | false, groups: readonly NavGroup[], path: string | null) {
  const isStatic = useIsStatic();
  const [stored] = useState(() => (isStatic ? {} : readStored(key)));
  const [collapsed, setCollapsed] = useState(stored.collapsed ?? false);
  const [open, setOpen] = useState<readonly string[]>(() => {
    const current = firstLevel(groups)
      .filter((item) => holdsCurrent(item, path))
      .map((item) => item.id);
    return [...new Set([...(stored.open ?? []), ...current])];
  });
  const save = useCallback(
    (next: Stored): void => {
      if (key !== false) localStorage.setItem(key, JSON.stringify(next));
    },
    [key],
  );
  return {
    collapsed,
    open,
    /** A tablet starts collapsed unless the stored state says otherwise. */
    startCollapsed: stored.collapsed === undefined ? () => setCollapsed(true) : undefined,
    toggleCollapsed: (): void => {
      setCollapsed(!collapsed);
      save({ collapsed: !collapsed, open: [...open] });
    },
    toggleSection: (id: string): void => {
      const next = open.includes(id) ? open.filter((x) => x !== id) : [...open, id];
      setOpen(next);
      save({ collapsed, open: next });
    },
  };
}

const asAction = (item: NavItem): MenuActionItem => ({
  id: item.id,
  label: item.label,
  icon: item.icon ? <Icon name={item.icon} /> : undefined,
  to: item.to,
});

interface SectionProps {
  item: NavItem;
  path: string | null;
  open: boolean;
  onToggle: () => void;
  subId: string;
}

/** A section: in the open column a disclosure with its sub-items under it; in the collapsed column a menu. */
function Section({ item, path, open, onToggle, subId, collapsed }: SectionProps & { collapsed: boolean }) {
  const isStatic = useIsStatic();
  const section = holdsCurrent(item, path) ? "" : undefined;
  const subs = item.items ?? [];
  const disclosure = (
    <>
      <button
        type="button"
        className="t-shell-link"
        aria-expanded={open}
        aria-controls={subId}
        data-id={item.id}
        data-current-section={section}
        onClick={onToggle}
      >
        <NavContent item={item} chevron />
      </button>
      <ul className="t-shell-sub" id={subId} hidden={!open}>
        {subs.map((sub) => (
          <li key={sub.id}>
            <NavLink item={sub} path={path} />
          </li>
        ))}
      </ul>
    </>
  );
  const menu = (
    <Menu
      label={item.label}
      items={[{ type: "group", label: item.label, items: subs.map(asAction) }]}
      trigger={
        <button type="button" className="t-shell-link" aria-label={item.label} data-current-section={section}>
          <NavContent item={item} />
        </button>
      }
    />
  );
  // The HTML kit gets both forms; the stylesheet shows the one for the state of the column.
  if (isStatic)
    return (
      <>
        {disclosure}
        {menu}
      </>
    );
  return collapsed ? menu : disclosure;
}

function Link({ item, path, collapsed }: { item: NavItem; path: string | null; collapsed: boolean }) {
  if (useIsStatic()) return <NavLink item={item} path={path} data-t="tooltip" />;
  if (!collapsed) return <NavLink item={item} path={path} />;
  return (
    <Tooltip text={item.label}>
      <NavLink item={item} path={path} />
    </Tooltip>
  );
}

function Groups({
  groups,
  path,
  state,
}: {
  groups: readonly NavGroup[];
  path: string | null;
  state: ReturnType<typeof useSidebarState>;
}) {
  const id = useId();
  return (
    <nav className="t-shell-nav" aria-label={t("mainNavigation")}>
      {groups.map((group) => (
        <div className="t-shell-group" key={group.id}>
          {group.label ? <div className="t-shell-group-label">{group.label}</div> : null}
          <ul className="t-shell-list" aria-label={group.label}>
            {group.items.map((item) => (
              <li key={item.id}>
                {item.items?.length ? (
                  <Section
                    item={item}
                    path={path}
                    open={state.open.includes(item.id)}
                    onToggle={() => state.toggleSection(item.id)}
                    subId={`${id}-${item.id}`}
                    collapsed={state.collapsed}
                  />
                ) : (
                  <Link item={item} path={path} collapsed={state.collapsed} />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function CollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const label = collapsed ? t("expandSidebar") : t("collapseSidebar");
  return (
    <Tooltip text={label}>
      <Button
        className="t-shell-collapse"
        variant="ghost"
        icon={<Glyph body={sidebar} />}
        label={label}
        aria-expanded={!collapsed}
        onClick={onToggle}
      />
    </Tooltip>
  );
}

/** The side navigation shell: a column with the brand, the actions, the links and the footer; a Page beside it. */
export function SideNavShell({
  brand,
  nav,
  actions,
  footer = [],
  theme,
  phoneNav = "drawer",
  storageKey = DEFAULT_KEY,
  contained,
  children,
}: SideNavShellProps) {
  const main = useId();
  const drawer = useNavDrawer();
  const path = useCurrentPath();
  const groups = toGroups<NavItem>(nav);
  const state = useSidebarState(storageKey, groups, path);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const { startCollapsed } = state;

  // Only once the root exists: a resize later never overrides what the user chose.
  // biome-ignore lint/correctness/useExhaustiveDependencies: startCollapsed changes on every render; the check runs once.
  useLayoutEffect(() => {
    if (root && startCollapsed && isTablet(root)) startCollapsed();
  }, [root]);

  const drawerProps = { brand, nav, footer, theme, control: drawer };
  return (
    <ShellRoot
      shell="sidenav"
      mainId={main}
      contained={contained}
      data-collapsed={state.collapsed ? "" : undefined}
      ref={setRoot}
    >
      <div
        className="t-shell-sidebar"
        data-t={useIsStatic() ? "sidenav" : undefined}
        data-storage-key={storageKey === false ? undefined : storageKey}
      >
        <ShellBar>
          {phoneNav === "drawer" ? <NavDrawer {...drawerProps} /> : null}
          <ShellBrandLink brand={brand} />
          {groups.length > 0 ? (
            <CollapseToggle collapsed={state.collapsed} onToggle={state.toggleCollapsed} />
          ) : null}
        </ShellBar>
        <ShellActions>{actions}</ShellActions>
        {groups.length > 0 ? <Groups groups={groups} path={path} state={state} /> : null}
        <ShellFooter facts={footer} theme={theme} />
      </div>
      <ShellMain id={main}>{children}</ShellMain>
      {phoneNav === "bar" ? (
        <>
          <BottomBar items={firstLevel(groups)} drawer={drawer} />
          <NavDrawer {...drawerProps} button={false} />
        </>
      ) : null}
    </ShellRoot>
  );
}

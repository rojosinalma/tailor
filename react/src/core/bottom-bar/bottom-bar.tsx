import { more } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { barItems, holdsCurrent, initial, isCurrent } from "@tailor/packs/core/shell-base/logic";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";
import { Counter } from "../counter/counter";
import { Icon } from "../icon/icon";
import type { NavDrawerControl } from "../nav-drawer/nav-drawer";
import { type NavItem, useCurrentPath } from "../shell-base/shell-base";

export interface BottomBarProps {
  /** The first-level items. Up to five show; with more, the first four and "More". */
  items: readonly NavItem[];
  /** The drawer that "More" and a section with sub-items open, from useNavDrawer(). Without one, at most five items show. */
  drawer?: NavDrawerControl;
}

function Content({ icon, label, counter }: { icon: ReactNode; label: string; counter?: ReactNode }) {
  return (
    <>
      <span className="t-bottom-bar-icon">{icon}</span>
      <span className="t-bottom-bar-label">{label}</span>
      {counter}
    </>
  );
}

/** A button that opens the drawer: a link to it in the HTML kit, which the drawer's script makes a button. */
function DrawerButton({
  drawer,
  section,
  children,
}: {
  drawer: NavDrawerControl;
  section?: boolean;
  children: ReactNode;
}) {
  const attributes = {
    className: "t-bottom-bar-item",
    "data-current-section": section ? "" : undefined,
  };
  if (useIsStatic())
    return (
      <a
        {...attributes}
        href={`#${drawer.id}`}
        data-t-open={drawer.id}
        aria-controls={drawer.id}
        aria-expanded="false"
      >
        {children}
      </a>
    );
  return (
    <button
      type="button"
      {...attributes}
      aria-expanded={drawer.open}
      aria-controls={drawer.open ? drawer.id : undefined}
      onClick={() => drawer.setOpen(true)}
    >
      {children}
    </button>
  );
}

function Item({ item, path, drawer }: { item: NavItem; path: string | null; drawer?: NavDrawerControl }) {
  const icon = item.icon ? (
    <Icon name={item.icon} />
  ) : (
    <span className="t-shell-initial" aria-hidden="true">
      {initial(item.label)}
    </span>
  );
  const content = (
    <Content
      icon={icon}
      label={item.label}
      counter={item.counter === undefined ? null : <Counter value={item.counter} tone={item.counterTone} />}
    />
  );
  const section = holdsCurrent(item, path);
  if (item.items?.length && drawer)
    return (
      <DrawerButton drawer={drawer} section={section}>
        {content}
      </DrawerButton>
    );
  const to = item.to ?? item.items?.find((sub) => sub.to !== undefined)?.to;
  if (to === undefined) return null;
  const current = isCurrent(item, path);
  return (
    <AppLink
      to={to}
      exact={item.exact}
      current={current}
      className="t-bottom-bar-item"
      data-current-section={!current && section ? "" : undefined}
    >
      {content}
    </AppLink>
  );
}

/** Navigation at the bottom of a phone screen. Inside a shell it shows on a phone only. */
export function BottomBar({ items, drawer }: BottomBarProps) {
  const path = useCurrentPath();
  if (items.length === 0) return null;
  const { shown, more: hasMore } = drawer ? barItems(items) : { shown: items.slice(0, 5), more: false };
  const rest = items.slice(shown.length);
  return (
    <nav className="t-bottom-bar" aria-label={t("mainNavigation")}>
      <ul className="t-bottom-bar-list">
        {shown.map((item) => (
          <li key={item.id}>
            <Item item={item} path={path} drawer={drawer} />
          </li>
        ))}
        {hasMore && drawer ? (
          <li>
            <DrawerButton
              drawer={drawer}
              section={rest.some((item) => isCurrent(item, path) || holdsCurrent(item, path))}
            >
              <Content icon={<Glyph body={more} />} label={t("more")} />
            </DrawerButton>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

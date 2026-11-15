import { Tabs as Base } from "@base-ui/react/tabs";
import type spec from "@tailor/packs/core/tabs/spec";
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";
import { Counter } from "../counter/counter";

type TabsVariant = (typeof spec.props.variant)[number];

export interface TabItem {
  /** Unique within the tabs; also the value. */
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  /** A small number after the label, such as the count of items behind the tab. */
  readonly counter?: number;
  readonly disabled?: boolean;
  readonly content: ReactNode;
}

export interface TabsProps {
  /** The accessible name of the tab list. */
  label: string;
  tabs: readonly TabItem[];
  value?: string;
  /** The tab that shows first. Without it, the first tab that is not disabled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
}

/** Scrolls the list sideways, never the page, until the tab is in view. */
function reveal(list: HTMLElement, tab: HTMLElement): void {
  const box = list.getBoundingClientRect();
  const item = tab.getBoundingClientRect();
  if (item.left < box.left) list.scrollLeft += item.left - box.left;
  else if (item.right > box.right) list.scrollLeft += item.right - box.right;
}

function TabInner({ icon, label, counter }: { icon?: ReactNode; label: string; counter?: number }) {
  return (
    <>
      {icon}
      <span className="t-tab-label">{label}</span>
      {counter === undefined ? null : <Counter value={counter} />}
    </>
  );
}

/** Switches between panels in one view. */
export function Tabs({ label, tabs, value, defaultValue, onValueChange, variant = "line" }: TabsProps) {
  const id = useId();
  const isStatic = useIsStatic();
  const list = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue ?? tabs.find((tab) => !tab.disabled)?.id);
  const selected = value ?? inner;
  const dataVariant = variant === "line" ? undefined : variant;
  const tabId = (tab: string): string => `${id}-tab-${tab}`;
  const panelId = (tab: string): string => `${id}-panel-${tab}`;

  useLayoutEffect(() => {
    const tab = selected === undefined ? null : document.getElementById(`${id}-tab-${selected}`);
    if (list.current && tab) reveal(list.current, tab);
  }, [id, selected]);

  if (isStatic) {
    // Every panel shows until the script hides the ones that are not selected.
    return (
      <div className="t-tabs" data-t="tabs" data-variant={dataVariant}>
        <div className="t-tabs-list" role="tablist" aria-label={label}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="t-tab"
              role="tab"
              id={tabId(tab.id)}
              aria-selected={tab.id === selected}
              aria-controls={panelId(tab.id)}
              aria-disabled={tab.disabled ? true : undefined}
              data-disabled={tab.disabled ? "" : undefined}
              tabIndex={tab.id === selected ? 0 : -1}
            >
              <TabInner icon={tab.icon} label={tab.label} counter={tab.counter} />
            </button>
          ))}
        </div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="t-tabs-panel"
            role="tabpanel"
            id={panelId(tab.id)}
            aria-labelledby={tabId(tab.id)}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a tab panel takes the focus after its tab, as in Base UI.
            tabIndex={0}
          >
            {tab.content}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Base.Root
      className="t-tabs"
      data-variant={dataVariant}
      value={selected}
      onValueChange={(next: string) => {
        setInner(next);
        onValueChange?.(next);
      }}
    >
      <Base.List ref={list} className="t-tabs-list" aria-label={label}>
        {tabs.map((tab) => (
          <Base.Tab key={tab.id} id={tabId(tab.id)} className="t-tab" value={tab.id} disabled={tab.disabled}>
            <TabInner icon={tab.icon} label={tab.label} counter={tab.counter} />
          </Base.Tab>
        ))}
      </Base.List>
      {tabs.map((tab) => (
        <Base.Panel key={tab.id} className="t-tabs-panel" value={tab.id}>
          {tab.content}
        </Base.Panel>
      ))}
    </Base.Root>
  );
}

export interface NavTabItem {
  /** The address of the sub-page. */
  readonly to: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly counter?: number;
  /** The tab is current only when the address matches exactly, for example the overview page. */
  readonly exact?: boolean;
  /** Marks the tab as the current page when no router can tell, for example in the HTML kit. */
  readonly current?: boolean;
}

export interface NavTabsProps {
  /** The accessible name of the navigation. */
  label: string;
  items: readonly NavTabItem[];
  variant?: TabsVariant;
}

/** The look of Tabs for the sub-pages of a page: each tab is a link. */
export function NavTabs({ label, items, variant = "line" }: NavTabsProps) {
  const list = useRef<HTMLUListElement>(null);

  // The router marks the current link, so look for it after every render.
  useLayoutEffect(() => {
    const tab = list.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list.current && tab) reveal(list.current, tab);
  });

  return (
    <nav
      className="t-tabs"
      data-kind="nav"
      data-variant={variant === "line" ? undefined : variant}
      aria-label={label}
    >
      <ul ref={list} className="t-tabs-list">
        {items.map((item) => (
          <li key={item.to}>
            <AppLink className="t-tab" to={item.to} exact={item.exact} current={item.current}>
              <TabInner icon={item.icon} label={item.label} counter={item.counter} />
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

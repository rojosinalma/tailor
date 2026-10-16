// Actions & navigation: button, button-group, segmented, menu, tabs,
// breadcrumb, pagination, list — markup per core/components.json; the
// tailor.js behaviours (filters, tabs, menus, listbox) are reimplemented as
// React state + the aria conventions from core/conventions.md §4.
import {
  useEffect, useId, useRef, useState,
  type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes,
  type KeyboardEvent, type ReactNode,
} from "react";
import { cx, dataAttr, type Size, type Tone } from "./util.ts";

/* ── icon slot ───────────────────────────────────────────────────────────── */

export function Icon({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-icon", className)} {...rest}>{children}</span>;
}

/* ── button ──────────────────────────────────────────────────────────────── */

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "warning" | "ghost" | "link";
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  /** Icon-only button (`data-icon="only"`); pair with `aria-label`. */
  iconOnly?: boolean;
  /** `aria-busy` loading state (also disables the button). */
  busy?: boolean;
  /** `aria-pressed` toggle state. */
  pressed?: boolean;
  /** Tooltip text (`data-tip`), shown by the UiProvider tooltip layer. */
  tip?: string;
  tipAt?: "top" | "bottom" | "left" | "right";
};

export function Button({
  variant, tone, size, iconOnly, busy, pressed, tip, tipAt, className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <button
      className={cx("t-btn", className)}
      data-variant={dataAttr(variant)}
      data-tone={dataAttr(tone)}
      data-size={dataAttr(size, "md")}
      data-icon={iconOnly ? "only" : undefined}
      data-tip={tip}
      data-tip-at={tipAt}
      aria-busy={busy || undefined}
      aria-pressed={pressed}
      disabled={busy ? true : disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── button-group / quick filter ─────────────────────────────────────────── */

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  /** Quick-filter mode (`data-role="filter"`): single-select aria-pressed. */
  filter?: boolean;
  size?: "sm" | "md" | "lg";
  /** Filter mode: the options, rendered as buttons. */
  options?: Array<{ value: string; label: ReactNode }>;
  /** Filter mode: controlled selected value. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export function ButtonGroup({
  label, filter, size, options, value, defaultValue, onChange, className, children, ...rest
}: ButtonGroupProps) {
  const [internal, setInternal] = useState(defaultValue ?? options?.[0]?.value);
  const selected = value !== undefined ? value : internal;
  return (
    <div
      className={cx("t-btn-group", className)}
      role="group"
      data-role={filter ? "filter" : undefined}
      aria-label={label}
      {...rest}
    >
      {options
        ? options.map((o) => (
            <Button
              key={o.value}
              size={size ?? "sm"}
              pressed={filter ? selected === o.value : undefined}
              onClick={() => { setInternal(o.value); onChange?.(o.value); }}
            >
              {o.label}
            </Button>
          ))
        : children}
    </div>
  );
}

/* ── segmented control ───────────────────────────────────────────────────── */

export type SegmentedProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
  label?: string;
  /** Radio group name; defaults to a generated id. */
  name?: string;
  size?: "sm" | "md";
  options: Array<{ value: string; label: ReactNode; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export function Segmented({
  label, name, size, options, value, defaultValue, onChange, className, ...rest
}: SegmentedProps) {
  const autoName = useId();
  const groupName = name ?? autoName;
  const controlled = value !== undefined;
  return (
    <div
      className={cx("t-segmented", className)}
      role="group"
      aria-label={label}
      data-size={dataAttr(size, "md")}
      {...rest}
    >
      {options.map((o) => (
        <label key={o.value} className="t-segmented-item">
          <input
            className="t-segmented-input"
            type="radio"
            name={groupName}
            disabled={o.disabled}
            {...(controlled
              ? { checked: value === o.value, onChange: () => onChange?.(o.value) }
              : { defaultChecked: defaultValue === o.value, onChange: () => onChange?.(o.value) })}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ── menu (dropdown) ─────────────────────────────────────────────────────── */

export type MenuProps = HTMLAttributes<HTMLDetailsElement> & {
  /** The trigger content, rendered as `<summary class="t-btn">`. */
  trigger: ReactNode;
  align?: "start" | "end";
  open?: boolean;
  summaryClassName?: string;
};

export function Menu({ trigger, align, open, summaryClassName, className, children, ...rest }: MenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = (e: Event) => {
      if (!el.open) return;
      if (e instanceof window.KeyboardEvent) {
        if (e.key === "Escape") el.open = false;
      } else if (e.target instanceof Node && !el.contains(e.target)) {
        el.open = false;
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", close); };
  }, []);
  return (
    <details ref={ref} className={cx("t-menu", className)} data-align={dataAttr(align)} open={open} {...rest}>
      <summary className={cx("t-btn", summaryClassName)}>{trigger}</summary>
      <ul className="t-menu-list" role="menu">{children}</ul>
    </details>
  );
}

export type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Render as `role="menuitemcheckbox"` with this checked state. */
  checked?: boolean;
  tone?: Tone;
  onSelect?: () => void;
};

function MenuItem({ checked, tone, onSelect, className, children, onClick, ...rest }: MenuItemProps) {
  return (
    <li>
      <button
        className={cx("t-menu-item", className)}
        role={checked !== undefined ? "menuitemcheckbox" : "menuitem"}
        aria-checked={checked}
        data-tone={dataAttr(tone)}
        onClick={(e) => { onSelect?.(); onClick?.(e); }}
        {...rest}
      >
        {children}
      </button>
    </li>
  );
}

function MenuHeader({ className, children, ...rest }: HTMLAttributes<HTMLLIElement>) {
  return <li className={cx("t-menu-header", className)} {...rest}>{children}</li>;
}

function MenuDivider({ className, ...rest }: HTMLAttributes<HTMLLIElement>) {
  return <li className={cx("t-menu-divider", className)} {...rest}></li>;
}

function MenuDesc({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-menu-desc", className)} {...rest}>{children}</span>;
}

function MenuKbd({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return <kbd className={cx("t-menu-kbd", className)} {...rest}>{children}</kbd>;
}

Menu.Item = MenuItem;
Menu.Header = MenuHeader;
Menu.Divider = MenuDivider;
Menu.Desc = MenuDesc;
Menu.Kbd = MenuKbd;

/* ── tabs ────────────────────────────────────────────────────────────────── */

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
  variant?: "underline" | "boxed";
  /** Tab definitions; ids follow the tailor pattern `t-<value>` / `p-<value>`. */
  tabs: Array<{ value: string; label: ReactNode; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** One panel per tab, keyed by tab value. */
  panels: Record<string, ReactNode>;
};

export function Tabs({ variant, tabs, value, defaultValue, onChange, panels, className, ...rest }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value);
  const active = value !== undefined ? value : internal;
  const listRef = useRef<HTMLDivElement>(null);

  const select = (v: string, focus = false) => {
    setInternal(v);
    onChange?.(v);
    if (focus) listRef.current?.querySelector<HTMLButtonElement>(`#t-${CSS.escape(v)}`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = tabs.filter((t) => !t.disabled);
    const i = enabled.findIndex((t) => t.value === active);
    const next: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: enabled.length - 1 };
    if (!(e.key in next)) return;
    e.preventDefault();
    const t = enabled[(next[e.key] + enabled.length) % enabled.length];
    if (t) select(t.value, true);
  };

  return (
    <div className={cx("t-tabs", className)} data-variant={dataAttr(variant)} {...rest}>
      <div className="t-tabs-list" role="tablist" ref={listRef} onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const selected = t.value === active;
          return (
            <button
              key={t.value}
              className="t-tab"
              role="tab"
              aria-selected={selected}
              aria-controls={`p-${t.value}`}
              id={`t-${t.value}`}
              tabIndex={selected ? undefined : -1}
              disabled={t.disabled}
              onClick={() => select(t.value)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.value}
          className="t-tab-panel"
          role="tabpanel"
          id={`p-${t.value}`}
          aria-labelledby={`t-${t.value}`}
          hidden={t.value !== active}
        >
          {panels[t.value]}
        </div>
      ))}
    </div>
  );
}

/* ── breadcrumb ──────────────────────────────────────────────────────────── */

export function Breadcrumb({ className, children, "aria-label": ariaLabel = "Breadcrumb", ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cx("t-breadcrumb", className)} aria-label={ariaLabel} {...rest}>
      <ol>{children}</ol>
    </nav>
  );
}

type BreadcrumbItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & { current?: boolean };

function BreadcrumbItem({ current, children, ...rest }: BreadcrumbItemProps) {
  if (current) return <li aria-current="page">{children}</li>;
  return <li><a {...rest}>{children}</a></li>;
}

Breadcrumb.Item = BreadcrumbItem;

/* ── pagination ──────────────────────────────────────────────────────────── */

type PaginationProps = HTMLAttributes<HTMLElement> & { size?: "sm" | "md" };

export function Pagination({ size, className, children, "aria-label": ariaLabel = "Pagination", ...rest }: PaginationProps) {
  return (
    <nav className={cx("t-pagination", className)} aria-label={ariaLabel} data-size={dataAttr(size, "md")} {...rest}>
      <ul>{children}</ul>
    </nav>
  );
}

type PageLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { current?: boolean; disabled?: boolean };

function PageLink({ current, disabled, className, children, ...rest }: PageLinkProps) {
  return (
    <li>
      <a
        className={cx("t-page-link", className)}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {children}
      </a>
    </li>
  );
}

Pagination.Link = PageLink;

/* ── selectable list (listbox) ───────────────────────────────────────────── */

export type ListProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  label?: string;
  multi?: boolean;
  size?: "sm" | "md";
  /** Controlled selection (item values). */
  selected?: string[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
};

export function List({
  label, multi, size, selected, defaultSelected, onChange, className, children, ...rest
}: ListProps) {
  const [internal, setInternal] = useState<string[]>(defaultSelected ?? []);
  const current = selected !== undefined ? selected : internal;
  const toggle = (v: string) => {
    const next = multi
      ? current.includes(v) ? current.filter((x) => x !== v) : [...current, v]
      : [v];
    setInternal(next);
    onChange?.(next);
  };
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("[role=option]:not(:disabled)") ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const n = e.key === "ArrowDown" ? i + 1 : i - 1;
    const t = items[(n + items.length) % items.length];
    if (t) { e.preventDefault(); t.focus(); }
  };
  return (
    <ListContext value={{ current, toggle }}>
      <div
        ref={ref}
        className={cx("t-list", className)}
        role="listbox"
        aria-label={label}
        aria-multiselectable={multi ? "true" : undefined}
        data-size={dataAttr(size, "md")}
        onKeyDown={onKeyDown}
        {...rest}
      >
        {children}
      </div>
    </ListContext>
  );
}

import { createContext, useContext } from "react";
const ListContext = createContext<{ current: string[]; toggle: (v: string) => void } | null>(null);

export type ListItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Selection value; when given, selection state comes from the List. */
  value?: string;
  selected?: boolean;
  /** Leading slot: a string renders as `t-icon t-list-lead`, a node as-is. */
  lead?: ReactNode;
  name: ReactNode;
  desc?: ReactNode;
  /** Trailing slot: a string renders as `t-list-trail`, a node as-is. */
  trail?: ReactNode;
};

function ListItem({ value, selected, lead, name, desc, trail, className, onClick, ...rest }: ListItemProps) {
  const ctx = useContext(ListContext);
  const isSelected = selected ?? (value !== undefined && ctx !== null ? ctx.current.includes(value) : false);
  return (
    <button
      className={cx("t-list-item", className)}
      role="option"
      aria-selected={isSelected}
      onClick={(e) => { if (value !== undefined) ctx?.toggle(value); onClick?.(e); }}
      {...rest}
    >
      {typeof lead === "string" ? <span className="t-icon t-list-lead">{lead}</span> : lead}
      <span className="t-list-body">
        <span className="t-list-name">{name}</span>
        {desc !== undefined && <span className="t-list-desc">{desc}</span>}
      </span>
      {typeof trail === "string" ? <span className="t-list-trail">{trail}</span> : trail}
    </button>
  );
}

function ListGroup({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-list-group", className)} {...rest}>{children}</div>;
}

function ListDivider({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-list-divider", className)} {...rest}></div>;
}

List.Item = ListItem;
List.Group = ListGroup;
List.Divider = ListDivider;

export type { Size as ButtonSize };

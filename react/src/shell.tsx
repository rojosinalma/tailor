// App shell & layout: app-shell, navbar, sidebar, footer, page, section,
// toolbar, grid, stack, split — markup per core/components.json.
import type { AnchorHTMLAttributes, HTMLAttributes, LiHTMLAttributes, ReactNode } from "react";
import { cx, dataAttr } from "./util.ts";

/* ── app-shell ───────────────────────────────────────────────────────────── */

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  /** Navbar content; rendered inside `<header class="t-navbar t-shell-nav">`. */
  nav?: ReactNode;
  /** Sidebar slot content (usually a `<Sidebar>`); rendered inside `<aside class="t-shell-side">`. */
  side?: ReactNode;
  /** Footer content; rendered inside `<footer class="t-footer t-shell-foot">`. */
  foot?: ReactNode;
  /** `data-sidebar` state. */
  sidebar?: "none" | "collapsed";
};

export function AppShell({ nav, side, foot, sidebar, className, children, ...rest }: AppShellProps) {
  return (
    <div className={cx("t-shell", className)} data-sidebar={dataAttr(sidebar)} {...rest}>
      {nav !== undefined && <header className="t-navbar t-shell-nav">{nav}</header>}
      {side !== undefined && <aside className="t-shell-side">{side}</aside>}
      <main className="t-shell-main t-page">{children}</main>
      {foot !== undefined && <footer className="t-footer t-shell-foot">{foot}</footer>}
    </div>
  );
}

/* ── navbar ──────────────────────────────────────────────────────────────── */

export function Navbar({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return <header className={cx("t-navbar", className)} {...rest}>{children}</header>;
}

function NavbarBrand({ className, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx("t-navbar-brand", className)} {...rest}>{children}</a>;
}

function NavbarNav({ className, children, ...rest }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cx("t-navbar-nav", className)} {...rest}>{children}</ul>;
}

type NavbarLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { current?: boolean };

function NavbarLink({ current, className, children, ...rest }: NavbarLinkProps) {
  return (
    <li>
      <a className={cx("t-navbar-link", className)} aria-current={current ? "page" : undefined} {...rest}>
        {children}
      </a>
    </li>
  );
}

function NavbarSep({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-navbar-sep", className)} {...rest}></span>;
}

function NavbarEnd({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-navbar-end", className)} {...rest}>{children}</div>;
}

Navbar.Brand = NavbarBrand;
Navbar.Nav = NavbarNav;
Navbar.Link = NavbarLink;
Navbar.Sep = NavbarSep;
Navbar.End = NavbarEnd;

/* ── sidebar ─────────────────────────────────────────────────────────────── */

type SidebarProps = HTMLAttributes<HTMLElement> & { label?: string };

export function Sidebar({ label = "Sections", className, children, ...rest }: SidebarProps) {
  return (
    <nav className={cx("t-sidebar", className)} aria-label={label} {...rest}>
      <ul>{children}</ul>
    </nav>
  );
}

function SidebarGroup({ className, children, ...rest }: LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cx("t-sidebar-group", className)} {...rest}>{children}</li>;
}

type SidebarItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  current?: boolean;
  /** Leading slot (an icon, a status dot…). */
  icon?: ReactNode;
  /** Trailing slot (a counter, a badge…). */
  trail?: ReactNode;
};

function SidebarItem({ current, icon, trail, className, children, ...rest }: SidebarItemProps) {
  return (
    <li>
      <a className={cx("t-sidebar-item", className)} aria-current={current ? "page" : undefined} {...rest}>
        {icon}
        <span className="t-sidebar-item-name">{children}</span>
        {trail}
      </a>
    </li>
  );
}

type SidebarCollapsibleProps = HTMLAttributes<HTMLElement> & {
  open?: boolean;
  icon?: ReactNode;
  trail?: ReactNode;
  /** The summary row label. */
  label: ReactNode;
};

function SidebarCollapsible({ open, icon, trail, label, children }: SidebarCollapsibleProps) {
  return (
    <li>
      <details open={open}>
        <summary className="t-sidebar-item">
          {icon}
          <span className="t-sidebar-item-name">{label}</span>
          {trail}
          <span className="t-sidebar-chevron"></span>
        </summary>
        <ul className="t-sidebar-nested">{children}</ul>
      </details>
    </li>
  );
}

function SidebarDivider({ className, ...rest }: LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cx("t-sidebar-divider", className)} {...rest}></li>;
}

Sidebar.Group = SidebarGroup;
Sidebar.Item = SidebarItem;
Sidebar.Collapsible = SidebarCollapsible;
Sidebar.Divider = SidebarDivider;

/* ── footer ──────────────────────────────────────────────────────────────── */

export function Footer({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return <footer className={cx("t-footer", className)} {...rest}>{children}</footer>;
}

function FooterRepo({ className, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx("t-footer-repo", className)} {...rest}>{children}</a>;
}

function FooterEnd({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-footer-end", className)} {...rest}>{children}</div>;
}

function FooterVersion({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-footer-version", className)} {...rest}>{children}</span>;
}

Footer.Repo = FooterRepo;
Footer.End = FooterEnd;
Footer.Version = FooterVersion;

/* ── page ────────────────────────────────────────────────────────────────── */

export function Page({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return <main className={cx("t-page", className)} {...rest}>{children}</main>;
}

function PageHeader({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return <header className={cx("t-page-header", className)} {...rest}>{children}</header>;
}

function PageBack({ className, children = "←", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx("t-page-back", className)} {...rest}>{children}</a>;
}

function PageTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cx("t-page-title", className)} {...rest}>{children}</h1>;
}

function PageLead({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-page-lead", className)} {...rest}>{children}</span>;
}

function PageActions({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-page-actions", className)} {...rest}>{children}</div>;
}

Page.Header = PageHeader;
Page.Back = PageBack;
Page.Title = PageTitle;
Page.Lead = PageLead;
Page.Actions = PageActions;

/* ── section ─────────────────────────────────────────────────────────────── */

type SectionProps = HTMLAttributes<HTMLElement> & { title: ReactNode };

export function Section({ title, className, children, ...rest }: SectionProps) {
  return (
    <section className={cx("t-section", className)} {...rest}>
      <h2 className="t-section-title">{title}</h2>
      <div className="t-section-body">{children}</div>
    </section>
  );
}

/* ── toolbar ─────────────────────────────────────────────────────────────── */

type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  align?: "start" | "center" | "end";
  gap?: "1" | "2" | "3" | "4";
};

export function Toolbar({ label, align, gap, className, children, ...rest }: ToolbarProps) {
  return (
    <div
      className={cx("t-toolbar", className)}
      role="toolbar"
      aria-label={label}
      data-align={dataAttr(align)}
      data-gap={dataAttr(gap)}
      {...rest}
    >
      {children}
    </div>
  );
}

function ToolbarSpacer({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-toolbar-spacer", className)} {...rest}></span>;
}

Toolbar.Spacer = ToolbarSpacer;

/* ── grid / stack / cluster / split ──────────────────────────────────────── */

type GridProps = HTMLAttributes<HTMLDivElement> & {
  cols?: "auto" | "1" | "2" | "3" | "4" | "6";
  min?: "xs" | "sm" | "md" | "lg";
  gap?: "1" | "2" | "3" | "4" | "5";
};

export function Grid({ cols, min, gap, className, children, ...rest }: GridProps) {
  return (
    <div
      className={cx("t-grid", className)}
      data-cols={dataAttr(cols)}
      data-min={dataAttr(min)}
      data-gap={dataAttr(gap)}
      {...rest}
    >
      {children}
    </div>
  );
}

type FlowProps = HTMLAttributes<HTMLDivElement> & {
  gap?: "0" | "1" | "2" | "3" | "4" | "5" | "6";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
};

export function Stack({ gap, align, className, children, ...rest }: FlowProps) {
  return (
    <div className={cx("t-stack", className)} data-gap={dataAttr(gap)} data-align={dataAttr(align)} {...rest}>
      {children}
    </div>
  );
}

export function Cluster({ gap, align, className, children, ...rest }: FlowProps) {
  return (
    <div className={cx("t-cluster", className)} data-gap={dataAttr(gap)} data-align={dataAttr(align)} {...rest}>
      {children}
    </div>
  );
}

type SplitProps = HTMLAttributes<HTMLDivElement> & { fill?: "viewport" };

export function Split({ fill, className, children, ...rest }: SplitProps) {
  return (
    <div className={cx("t-split", className)} data-fill={dataAttr(fill)} {...rest}>
      {children}
    </div>
  );
}

function SplitSide({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-split-side", className)} {...rest}>{children}</div>;
}

function SplitPane({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-split-pane", className)} {...rest}>{children}</div>;
}

Split.Side = SplitSide;
Split.Pane = SplitPane;

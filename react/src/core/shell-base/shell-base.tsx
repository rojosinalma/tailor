import { chevronDown, search as searchGlyph } from "@tailor/core/glyphs.gen";
import type { Tone } from "@tailor/core/spec";
import { t } from "@tailor/core/text";
import {
  holdsCurrent,
  initial,
  isCurrent,
  nextRegion,
  type ShellForm,
  shellForm,
  toGroups,
} from "@tailor/packs/core/shell-base/logic";
import type spec from "@tailor/packs/core/shell-base/spec";
import { useRouter } from "@tanstack/react-router";
import {
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";
import { Button } from "../button/button";
import { ConfirmRegion } from "../confirm/confirm";
import { Counter } from "../counter/counter";
import { Icon, type IconName } from "../icon/icon";
import { ThemePickers, type ThemePickersProps, useHasTheme } from "../theme-pickers/theme-pickers";
import { ToastRegion } from "../toast/toast";

export { firstLevel, type ShellForm, toGroups } from "@tailor/packs/core/shell-base/logic";

/** One navigation link. With `items`, it is a section that holds one level of sub-items. */
export interface NavItem {
  id: string;
  label: string;
  /** An icon from the sprite, for example "bi:hdd-stack". Without one, the first letter of the label shows. */
  icon?: IconName;
  /** The address. A section with `items` needs none. */
  to?: string;
  /** Current only when the address matches exactly. Use it for "/". */
  exact?: boolean;
  /** Marks the page as current when no router can tell: plain pages and the HTML kit. */
  current?: boolean;
  /** A short muted text after the label, such as the group or the pack of the page. */
  hint?: string;
  /** A number next to the label, such as open issues. */
  counter?: number;
  counterTone?: Tone;
  /** One level of sub-items. */
  items?: readonly NavItem[];
}

export interface NavGroup {
  id: string;
  /** Shown above the links. A group without a label has none. */
  label?: string;
  items: readonly NavItem[];
}

export interface ShellBrand {
  name: string;
  icon?: IconName;
  /** A logo in place of the icon, such as an <img alt=""> or an <svg aria-hidden>. */
  logo?: ReactNode;
  /** Where the brand links to. Default "/". */
  to?: string;
}

/** One footer fact: a version, a link. */
export interface FooterFact {
  id: string;
  /** Shown before the value, such as "Version". */
  label?: string;
  value: ReactNode;
  /** Makes the value a link. */
  to?: string;
}

export type ShellThemePart = (typeof spec.props.theme)[number];
type ShellName = (typeof spec.props.shell)[number];

/** The data that every shell takes. A shell draws everything from it; the app gives no markup but a Page. */
export interface ShellCommon {
  brand: ShellBrand;
  /**
   * The search of the whole app, such as a Search field. It sits in the bar (or under the brand in a side
   * column); on a phone it folds into an icon button that opens it as a row under the bar, so the brand keeps
   * its name. Keep it out of `actions`.
   */
  search?: ReactNode;
  /** Global actions, such as a user Menu. On a phone they stay in the top bar: keep them compact (icon buttons). */
  actions?: ReactNode;
  footer?: FooterFact[];
  /** The theme controls that the shell shows. Default ["mode"]. `false` shows none. */
  theme?: readonly ShellThemePart[] | false;
  /** For previews: fills its parent instead of the screen, and takes the phone form from its own width. */
  contained?: boolean;
  /** The content region: one Page. */
  children: ReactNode;
}

export const DEFAULT_THEME: readonly ShellThemePart[] = ["mode"];

/** The path of the router's current location, or null without a router. */
export function useCurrentPath(): string | null {
  const router = useRouter({ warn: false }) as ReturnType<typeof useRouter> | undefined;
  return useSyncExternalStore(
    (listener) => (router ? router.subscribe("onResolved", listener) : () => {}),
    () => router?.state.location.pathname ?? null,
    () => null,
  );
}

const FIELD = "input, textarea, select, [contenteditable]";

/** Follows the visual viewport (the on-screen keyboard, the browser bars) in --t-viewport-h on <html>. */
function useViewportHeight(enabled: boolean): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) return;
    const root = document.documentElement;
    const update = (): void => {
      root.style.setProperty("--t-viewport-h", `${viewport.height + viewport.offsetTop}px`);
      const field = document.activeElement;
      if (field instanceof HTMLElement && field.matches(FIELD)) field.scrollIntoView({ block: "nearest" });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--t-viewport-h");
    };
  }, [enabled]);
}

export interface ShellRootProps extends Omit<ComponentProps<"div">, "style" | "className"> {
  shell: ShellName;
  /** The id of the main region, for the skip link. */
  mainId: string;
  contained?: boolean;
  children: ReactNode;
}

/**
 * The root of a shell: the frame, the skip link as the first focusable element, the viewport height
 * and, in the React kit, the toast and confirm regions.
 */
export function ShellRoot({ shell, mainId, contained, children, ...rest }: ShellRootProps) {
  const isStatic = useIsStatic();
  useViewportHeight(!contained && !isStatic);
  const skip = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    document.getElementById(mainId)?.focus();
  };
  return (
    <div
      className="t-shell"
      data-shell={shell}
      data-contained={contained ? "" : undefined}
      data-t="shell"
      {...rest}
    >
      <a className="t-shell-skip" href={`#${mainId}`} onClick={skip}>
        {t("skipToContent")}
      </a>
      {children}
      {isStatic ? null : (
        <>
          <ToastRegion />
          <ConfirmRegion />
        </>
      )}
    </div>
  );
}

/** The content region. It takes the focus from the skip link. */
export function ShellMain({ id, children }: { id: string; children: ReactNode }) {
  return (
    <main className="t-shell-main" id={id} tabIndex={-1}>
      {children}
    </main>
  );
}

/** A top bar: the header of a shell. Other props, such as tabIndex and ref, go to the header. */
export function ShellBar({ children, ...rest }: Omit<ComponentProps<"header">, "className" | "style">) {
  return (
    <header className="t-shell-bar" {...rest}>
      {children}
    </header>
  );
}

const rem = (): number => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The form of a shell from the width of its root (phone, tablet, desktop), in step with its size. Desktop until measured. */
export function useShellForm(root: HTMLElement | null): ShellForm {
  const [form, setForm] = useState<ShellForm>("desktop");
  useLayoutEffect(() => {
    if (!root) return;
    const update = (): void => setForm(shellForm(root.clientWidth, rem()));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [root]);
  return form;
}

/**
 * True when the root was a tablet or a phone at its first layout: a sidebar that would lie over the centre
 * starts collapsed there. A resize later never changes it, so it never overrides what the user chose.
 */
export function useNarrowStart(root: HTMLElement | null): boolean {
  const [narrow, setNarrow] = useState(false);
  const measured = useRef(false);
  useLayoutEffect(() => {
    if (!root || measured.current) return;
    measured.current = true;
    if (shellForm(root.clientWidth, rem()) !== "desktop") setNarrow(true);
  }, [root]);
  return narrow;
}

/** F6 and Shift+F6 move the focus to the next or the previous visible region (the `regions` under the root). */
export function cycleRegions(root: HTMLElement, event: KeyboardEvent<HTMLElement>, regions: string): void {
  if (event.key !== "F6") return;
  const shown = [...root.querySelectorAll<HTMLElement>(regions)].filter((r) => r.checkVisibility());
  const at = shown.findIndex((r) => r.contains(document.activeElement));
  const next = shown[nextRegion(at, shown.length, event.shiftKey)];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

/** The open state of a shell's search on a phone, shared by its button and its row. */
export interface ShellSearchControl {
  readonly id: string;
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}

export function useShellSearch(): ShellSearchControl {
  const id = useId();
  const [open, setOpen] = useState(false);
  return { id, open, setOpen };
}

const focusField = (id: string): void =>
  document.getElementById(id)?.querySelector<HTMLElement>("input, textarea, select")?.focus();

/**
 * The search of a shell in its place. On a phone it shows only while its button has opened it, as a row
 * under the bar; Escape in an empty field closes it and the focus goes back to the button.
 */
export function ShellSearch({ control, children }: { control: ShellSearchControl; children?: ReactNode }) {
  const isStatic = useIsStatic();
  if (!children) return null;
  // Before the field's own Escape (which clears it first): an empty field closes the row.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Escape" || !control.open) return;
    if (event.target instanceof HTMLInputElement && event.target.value !== "") return;
    control.setOpen(false);
    document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(control.id)}"]`)?.focus();
  };
  return (
    // biome-ignore lint/a11y/useSemanticElements: <search> is too new for every browser that tailor supports.
    <div
      className="t-shell-search"
      id={control.id}
      role="search"
      data-open={!isStatic && control.open ? "" : undefined}
      onKeyDownCapture={isStatic ? undefined : onKeyDown}
    >
      {children}
    </div>
  );
}

/** The phone's search button: it opens the search as a row under the bar and gives the field the focus. */
export function ShellSearchButton({ control }: { control: ShellSearchControl }) {
  if (useIsStatic())
    return (
      <a
        className="t-btn t-shell-search-button"
        data-variant="ghost"
        data-icon-only=""
        href={`#${control.id}`}
        aria-label={t("search")}
        aria-controls={control.id}
        aria-expanded="false"
      >
        <Glyph body={searchGlyph} />
      </a>
    );
  return (
    <Button
      className="t-shell-search-button"
      variant="ghost"
      icon={<Glyph body={searchGlyph} />}
      label={t("search")}
      aria-expanded={control.open}
      aria-controls={control.id}
      onClick={() => {
        const next = !control.open;
        control.setOpen(next);
        // The row shows on the next paint; the field takes the focus then.
        if (next) requestAnimationFrame(() => focusField(control.id));
      }}
    />
  );
}

/** The global actions, at the end of a bar. */
export function ShellActions({ children }: { children?: ReactNode }) {
  return children ? <div className="t-shell-actions">{children}</div> : null;
}

/**
 * The footer of a shell: the facts at the start, the theme controls at the end. Nothing when both are empty.
 * A footer in a narrow column takes the compact theme controls.
 */
export function ShellFooter({
  facts = [],
  theme,
  themeLayout,
}: {
  facts?: readonly FooterFact[];
  theme?: readonly ShellThemePart[] | false;
  themeLayout?: ShellThemeLayout;
}) {
  if (facts.length === 0 && (theme === false || theme?.length === 0)) return null;
  return (
    <footer className="t-shell-footer">
      <FooterFacts facts={facts} />
      <ShellTheme parts={theme} layout={themeLayout} />
    </footer>
  );
}

/** The brand: a link home with the mark and the name. The page's h1 is the Page title, never the brand. */
export function ShellBrandLink({ brand, compact }: { brand: ShellBrand; compact?: boolean }) {
  const mark = brand.logo ?? (brand.icon ? <Icon name={brand.icon} /> : null);
  return (
    <AppLink
      to={brand.to ?? "/"}
      className="t-shell-brand"
      exact
      aria-label={compact ? brand.name : undefined}
    >
      {mark ? <span className="t-shell-brand-mark">{mark}</span> : null}
      <span className="t-shell-brand-name">{brand.name}</span>
    </AppLink>
  );
}

/** The icon of a link, or the first letter of its label in a small box. */
export function NavIcon({ item }: { item: Pick<NavItem, "icon" | "label"> }) {
  return (
    <span className="t-shell-icon">
      {item.icon ? (
        <Icon name={item.icon} />
      ) : (
        <span className="t-shell-initial" aria-hidden="true">
          {initial(item.label)}
        </span>
      )}
    </span>
  );
}

/** Icon, label and counter: the inside of every navigation link. */
export function NavContent({ item, chevron }: { item: NavItem; chevron?: boolean }) {
  return (
    <>
      <NavIcon item={item} />
      <span className="t-shell-label">{item.label}</span>
      {item.hint ? <span className="t-shell-hint">{item.hint}</span> : null}
      {item.counter === undefined ? null : <Counter value={item.counter} tone={item.counterTone} />}
      {chevron ? (
        <span className="t-shell-chevron">
          <Glyph body={chevronDown} />
        </span>
      ) : null}
    </>
  );
}

export interface NavLinkProps extends Omit<ComponentProps<"a">, "href" | "style" | "className"> {
  item: NavItem;
  path: string | null;
}

/** One navigation link. The current page gets aria-current="page"; a section with the current page in it data-current-section. */
export function NavLink({ item, path, ...rest }: NavLinkProps) {
  const current = isCurrent(item, path);
  const section = !current && holdsCurrent(item, path);
  const content = <NavContent item={item} />;
  if (item.to === undefined)
    return (
      <span className="t-shell-link" data-current-section={section ? "" : undefined}>
        {content}
      </span>
    );
  return (
    <AppLink
      to={item.to}
      exact={item.exact}
      current={current}
      className="t-shell-link"
      data-current-section={section ? "" : undefined}
      {...rest}
    >
      {content}
    </AppLink>
  );
}

/** The groups of a navigation as vertical lists, sub-items indented and always shown. */
export function NavLists({
  nav,
  path,
  label,
}: {
  nav: readonly NavItem[] | readonly NavGroup[];
  path: string | null;
  label: string;
}) {
  return (
    <nav className="t-shell-nav" aria-label={label}>
      {toGroups<NavItem>(nav).map((group) => (
        <div className="t-shell-group" key={group.id}>
          {group.label ? <div className="t-shell-group-label">{group.label}</div> : null}
          <ul className="t-shell-list" aria-label={group.label}>
            {group.items.map((item) => (
              <li key={item.id}>
                <NavLink item={item} path={path} />
                {item.items?.length ? (
                  <ul className="t-shell-sub">
                    {item.items.map((sub) => (
                      <li key={sub.id}>
                        <NavLink item={sub} path={path} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** The footer facts, as one list. */
export function FooterFacts({ facts }: { facts: readonly FooterFact[] }) {
  if (facts.length === 0) return null;
  return (
    <ul className="t-shell-facts">
      {facts.map((fact) => (
        <li className="t-shell-fact" key={fact.id}>
          {/* A plain value joins the label in one text node, as the static markup has it. */}
          {fact.to === undefined && fact.label && typeof fact.value === "string" ? (
            `${fact.label} ${fact.value}`
          ) : (
            <>
              {fact.label ? `${fact.label} ` : null}
              {fact.to === undefined ? fact.value : <AppLink to={fact.to}>{fact.value}</AppLink>}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The layout of a shell's theme controls: `compact` where they sit in a narrow column. */
export type ShellThemeLayout = NonNullable<ThemePickersProps["layout"]>;

function LiveTheme({ parts, layout }: { parts: readonly ShellThemePart[]; layout?: ShellThemeLayout }) {
  if (!useHasTheme()) return null;
  return (
    <div className="t-shell-theme">
      <ThemePickers parts={parts} layout={layout} />
    </div>
  );
}

/** The theme controls of a shell. Without a theme on the page they show nothing. */
export function ShellTheme({
  parts,
  layout,
}: {
  parts: readonly ShellThemePart[] | false | undefined;
  layout?: ShellThemeLayout;
}) {
  const isStatic = useIsStatic();
  const shown = parts === undefined ? DEFAULT_THEME : parts;
  if (shown === false || shown.length === 0) return null;
  if (isStatic)
    return (
      <div className="t-shell-theme">
        <ThemePickers parts={shown} layout={layout} />
      </div>
    );
  return <LiveTheme parts={shown} layout={layout} />;
}

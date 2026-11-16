import {
  chevronDown,
  chevronUp,
  close,
  gear,
  menu,
  panelBottom,
  panels as panelsGlyph,
  sidebar as sidebarGlyph,
} from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  lengthToPx,
  parseLayout,
  resizeByKey,
  resizeByPointer,
  SIZE_TOKENS,
  type SplitBounds,
  type WorkspaceLayout,
  type WorkspaceSide,
} from "@tailor/packs/shell-workspace/workspace/logic";
import type spec from "@tailor/packs/shell-workspace/workspace/spec";
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { BottomSheet } from "../../core/bottom-sheet/bottom-sheet";
import { Button, ButtonLink } from "../../core/button/button";
import { Dialog } from "../../core/dialog/dialog";
import { Drawer } from "../../core/drawer/drawer";
import { Icon, type IconName } from "../../core/icon/icon";
import { Menu } from "../../core/menu/menu";
import {
  cycleRegions,
  type FooterFact,
  FooterFacts,
  type NavGroup,
  type NavItem,
  NavLists,
  ShellActions,
  ShellBar,
  ShellBrandLink,
  type ShellCommon,
  ShellMain,
  ShellRoot,
  ShellSearch,
  ShellSearchButton,
  ShellTheme,
  type ShellThemePart,
  toGroups,
  useCurrentPath,
  useNarrowStart,
  useShellForm,
  useShellSearch,
} from "../../core/shell-base/shell-base";
import { Tooltip } from "../../core/tooltip/tooltip";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

/** One right panel: a button in the rail opens it. */
export interface WorkspacePanel {
  id: string;
  label: string;
  icon: IconName;
  content: ReactNode;
}

/** The bottom panel under the centre, such as a log. */
export interface WorkspaceBottom {
  label: string;
  content: ReactNode;
  /** Small buttons in its header row. */
  actions?: ReactNode;
}

export interface WorkspaceShellProps extends ShellCommon {
  /** The links between the areas of the app, at the top of the left sidebar. A plain list is one group. */
  nav?: NavGroup[] | NavItem[];
  /** The app's own content in the left sidebar under the links, such as a tree or a list. It scrolls alone. */
  sidebar?: ReactNode;
  /** The name of the left sidebar region. Default "Sidebar". */
  sidebarLabel?: string;
  /** The right panels, one open at a time. */
  panels?: WorkspacePanel[];
  /** "float": the open panel lies over the end of the centre. "push": the centre gets narrower. Default "float". */
  panelMode?: (typeof spec.props.panelMode)[number];
  /** The id of the panel that is open at the start on a wide screen, unless the remembered layout says otherwise. */
  defaultPanel?: string;
  bottom?: WorkspaceBottom;
  /** The settings UI. A gear in the sidebar's footer row opens it in a large dialog. */
  settings?: ReactNode;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  /** Where the layout is remembered (localStorage). Default "tailor.workspace"; `false` remembers nothing. */
  storageKey?: string | false;
}

const DEFAULT_KEY = "tailor.workspace";
const SIDES: readonly WorkspaceSide[] = ["left", "right", "bottom"];
const REGIONS =
  ":scope > :is(.t-shell-bar, .t-shell-sidebar, .t-shell-main, .t-workspace-panel, .t-workspace-bottom)";

type Sizes = Record<WorkspaceSide, SplitBounds & { start: number }>;

const rem = (): number => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The least, starting and most size of each region, from the measure tokens. */
function readSizes(root: HTMLElement): Sizes {
  const style = getComputedStyle(root);
  const px = (token: string): number => lengthToPx(style.getPropertyValue(token), rem());
  const entry = (side: WorkspaceSide) => {
    const [min, start, max] = SIZE_TOKENS[side].map(px) as [number, number, number];
    return { min, start, max };
  };
  return { left: entry("left"), right: entry("right"), bottom: entry("bottom") };
}

function readLayout(key: string | false): WorkspaceLayout {
  if (key === false) return {};
  try {
    return parseLayout(localStorage.getItem(key));
  } catch {
    return {};
  }
}

function writeLayout(key: string | false, layout: WorkspaceLayout): void {
  if (key === false) return;
  try {
    localStorage.setItem(key, JSON.stringify(layout));
  } catch {
    // Storage can be full or blocked; the layout then lasts for this page only.
  }
}

const isFloating = (element: Element): boolean => getComputedStyle(element).position === "absolute";

interface HandleProps {
  side: WorkspaceSide;
  controls: string;
  size?: number;
  bounds?: SplitBounds;
  onResize?: (size: number, done: boolean) => void;
}

/** The resize handle on the inner edge of a region: a separator that the pointer drags and the arrows move. */
function Handle({ side, controls, size, bounds, onResize }: HandleProps) {
  const [dragging, setDragging] = useState(false);
  const live = bounds && size !== undefined && onResize;
  const fromPointer = (event: PointerEvent<HTMLDivElement>): number | null => {
    const box = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!box || !bounds) return null;
    if (side === "left") return resizeByPointer(side, event.clientX, box.left, bounds);
    if (side === "right") return resizeByPointer(side, event.clientX, box.right, bounds);
    return resizeByPointer(side, event.clientY, box.bottom, bounds);
  };
  const end = (event: PointerEvent<HTMLDivElement>): void => {
    if (!dragging) return;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const next = fromPointer(event);
    if (next !== null) onResize?.(next, true);
  };
  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable separator is a widget; <hr> cannot take focus or a value.
    <div
      className="t-workspace-handle"
      role="separator"
      tabIndex={0}
      aria-orientation={side === "bottom" ? "horizontal" : "vertical"}
      aria-label={side === "left" ? t("resizeSidebar") : t("resizePanel")}
      aria-controls={controls}
      aria-valuenow={live ? Math.round(size) : undefined}
      aria-valuemin={live ? Math.round(bounds.min) : undefined}
      aria-valuemax={live ? Math.round(bounds.max) : undefined}
      data-side={side}
      data-dragging={dragging ? "" : undefined}
      {...(live
        ? {
            onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
              if (event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
            },
            onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
              const next = dragging ? fromPointer(event) : null;
              if (next !== null) onResize(next, false);
            },
            onPointerUp: end,
            onPointerCancel: end,
            onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
              const next = resizeByKey(side, event.key, size, bounds, rem());
              if (next === null) return;
              event.preventDefault();
              onResize(next, true);
            },
          }
        : {})}
    />
  );
}

/** The footer row: facts, theme controls and the settings gear. */
function FooterRow({
  facts,
  theme,
  gear: gearButton,
}: {
  facts: readonly FooterFact[];
  theme?: readonly ShellThemePart[] | false;
  gear: ReactNode;
}) {
  return (
    <footer className="t-shell-footer">
      <FooterFacts facts={facts} />
      <ShellTheme parts={theme} layout="compact" />
      {gearButton}
    </footer>
  );
}

/** The settings dialog with the gear that opens it. Without a gear, the app opens it through settingsOpen. */
function Settings({
  settings,
  open,
  onOpenChange,
  withGear = true,
}: {
  settings: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withGear?: boolean;
}) {
  const isStatic = useIsStatic();
  const button = (
    <Button
      className="t-workspace-settings"
      variant="ghost"
      size="sm"
      icon={<Glyph body={gear} />}
      label={t("settings")}
    />
  );
  return (
    <Dialog
      trigger={withGear ? button : undefined}
      title={t("settings")}
      size="lg"
      {...(isStatic ? {} : { open, onOpenChange })}
    >
      {settings}
    </Dialog>
  );
}

/**
 * A top bar button for a phone sheet. In the HTML kit it starts as a link to its region. A plain function,
 * not a component: the sheet's trigger puts its own props on the element it returns.
 */
function phoneButton(
  isStatic: boolean,
  {
    className = "t-workspace-phone",
    icon,
    label,
    region,
  }: { className?: string; icon: ReactNode; label: string; region: string },
): ReactElement {
  if (isStatic)
    return <ButtonLink className={className} variant="ghost" icon={icon} label={label} to={`#${region}`} />;
  return <Button className={className} variant="ghost" icon={icon} label={label} />;
}

/** The workspace shell: a top bar, a left sidebar, the centre, right panels behind a rail, a bottom panel. */
export function WorkspaceShell({
  brand,
  search,
  actions,
  footer = [],
  theme,
  nav = [],
  sidebar,
  sidebarLabel = t("sidebar"),
  panels = [],
  panelMode = "float",
  defaultPanel,
  bottom,
  settings,
  settingsOpen,
  onSettingsOpenChange,
  storageKey = DEFAULT_KEY,
  contained,
  children,
}: WorkspaceShellProps) {
  const isStatic = useIsStatic();
  const base = useId();
  const ids = {
    main: `${base}-main`,
    left: `${base}-left`,
    bottom: `${base}-bottom`,
    bottomBody: `${base}-bottom-body`,
    panel: (id: string) => `${base}-panel-${id}`,
  };
  const path = useCurrentPath();
  const groups = toGroups<NavItem>(nav);
  const hasLeft = groups.length > 0 || sidebar !== undefined;

  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const form = useShellForm(root);
  // A tablet or a phone starts with the sidebar and the default panel closed: both would lie over the centre.
  const narrowStart = useNarrowStart(root);
  const searchControl = useShellSearch();
  const [sizes, setSizes] = useState<Sizes | null>(null);
  const [layout, setLayout] = useState<WorkspaceLayout>(() => (isStatic ? {} : readLayout(storageKey)));
  const [ownSettings, setOwnSettings] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);

  const update = useCallback(
    (patch: WorkspaceLayout, save = true): void =>
      setLayout((current) => {
        const next = { ...current, ...patch };
        if (save) writeLayout(storageKey, next);
        return next;
      }),
    [storageKey],
  );

  useLayoutEffect(() => {
    if (root) setSizes(readSizes(root));
  }, [root]);

  // The sizes are custom properties on the root, read by the grid.
  const { left: leftSize, right: rightSize, bottom: bottomSize } = layout;
  useLayoutEffect(() => {
    if (!root) return;
    const values = { left: leftSize, right: rightSize, bottom: bottomSize };
    for (const side of SIDES) {
      const value = values[side];
      if (value === undefined) root.style.removeProperty(`--t-workspace-${side}`);
      else root.style.setProperty(`--t-workspace-${side}`, `${value}px`);
    }
  }, [root, leftSize, rightSize, bottomSize]);

  // A sheet belongs to the phone form; it closes when the form changes.
  useLayoutEffect(() => {
    if (form !== "phone") setSheet(null);
  }, [form]);

  const leftCollapsed = layout.leftCollapsed ?? narrowStart;
  const chosen = layout.panel === undefined ? (narrowStart ? null : defaultPanel) : layout.panel;
  const open = panels.some((p) => p.id === chosen) ? (chosen ?? null) : null;
  const bottomCollapsed = layout.bottomCollapsed ?? false;
  const settingsShown = settingsOpen ?? ownSettings;
  const setSettings = (next: boolean): void => {
    setOwnSettings(next);
    onSettingsOpenChange?.(next);
  };
  const phone = !isStatic && form === "phone";
  const desktop = isStatic || form !== "phone";

  const focusIn = (selector: string): void => root?.querySelector<HTMLElement>(selector)?.focus();
  const railButton = (id: string): string =>
    `.t-workspace-rail [aria-controls="${CSS.escape(ids.panel(id))}"]`;
  const togglePanel = (id: string): void => update({ panel: open === id ? null : id });
  const closePanel = (id: string): void => {
    update({ panel: null });
    focusIn(railButton(id));
  };
  const toggleLeft = (): void => update({ leftCollapsed: !leftCollapsed });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (root) cycleRegions(root, event, REGIONS);
  };

  // Escape closes a region that lies over the centre: a floating panel, the tablet's sidebar.
  const escapes =
    (close: () => void) =>
    (event: KeyboardEvent<HTMLElement>): void => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
      if (!isFloating(event.currentTarget)) return;
      event.preventDefault();
      close();
    };

  const sizeOf = (side: WorkspaceSide): number | undefined => layout[side] ?? sizes?.[side].start;
  const handle = (side: WorkspaceSide, controls: string) => (
    <Handle
      side={side}
      controls={controls}
      size={sizeOf(side)}
      bounds={sizes?.[side]}
      onResize={(size, done) => update({ [side]: size }, done)}
    />
  );

  const settingsPart = (withGear = true) =>
    settings === undefined ? null : (
      <Settings settings={settings} open={settingsShown} onOpenChange={setSettings} withGear={withGear} />
    );
  const footerRow = <FooterRow facts={footer} theme={theme} gear={settingsPart()} />;

  // The parts of the left sidebar; on a phone they fill the navigation sheet.
  const sidebarParts = (
    <>
      {groups.length > 0 ? <NavLists nav={groups} path={path} label={t("mainNavigation")} /> : null}
      {sidebar === undefined ? null : (
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the body scrolls alone; the keyboard scrolls it once it has the focus.
        <div className="t-workspace-sidebar-body" tabIndex={0}>
          {sidebar}
        </div>
      )}
      {footerRow}
    </>
  );

  // Choosing a link in the navigation sheet closes it.
  const closeOnLink = (event: MouseEvent<HTMLElement>): void => {
    if (event.target instanceof Element && event.target.closest("a[href]")) setSheet(null);
  };
  const sheetState = (id: string) =>
    isStatic ? {} : { open: sheet === id, onOpenChange: (next: boolean) => setSheet(next ? id : null) };

  const menuSheet = hasLeft ? (
    <Drawer
      trigger={phoneButton(isStatic, {
        className: "t-shell-menu-button",
        icon: <Glyph body={menu} />,
        label: t("menu"),
        region: ids.left,
      })}
      title={t("menu")}
      side="start"
      size="full"
      {...sheetState("left")}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: the links inside take the keys; this only hears their clicks. */}
      <div className="t-workspace-sheet" data-region="left" onClick={closeOnLink}>
        {isStatic ? null : sidebarParts}
      </div>
    </Drawer>
  ) : null;

  const panelSheet = (panel: WorkspacePanel, trigger: boolean) => (
    <Drawer
      key={panel.id}
      trigger={
        trigger
          ? phoneButton(isStatic, {
              icon: <Icon name={panel.icon} />,
              label: panel.label,
              region: ids.panel(panel.id),
            })
          : undefined
      }
      title={panel.label}
      size="full"
      {...sheetState(panel.id)}
    >
      <div className="t-workspace-sheet" data-panel={panel.id}>
        {isStatic ? null : panel.content}
      </div>
    </Drawer>
  );

  const panelSheets =
    panels.length === 0 ? null : panels.length <= 2 ? (
      panels.map((panel) => panelSheet(panel, true))
    ) : (
      <>
        <Menu
          label={t("panels")}
          align="end"
          trigger={
            <Button
              className="t-workspace-phone"
              variant="ghost"
              icon={<Glyph body={panelsGlyph} />}
              label={t("panels")}
            />
          }
          items={panels.map((panel) => ({
            id: panel.id,
            label: panel.label,
            icon: <Icon name={panel.icon} />,
            onSelect: () => setSheet(panel.id),
          }))}
        />
        {panels.map((panel) => panelSheet(panel, false))}
      </>
    );

  const bottomSheet = bottom ? (
    <BottomSheet
      trigger={phoneButton(isStatic, {
        icon: <Glyph body={panelBottom} />,
        label: bottom.label,
        region: ids.bottom,
      })}
      title={bottom.label}
      footer={isStatic && bottom.actions ? <div className="t-workspace-actions" /> : bottom.actions}
      {...sheetState("bottom")}
    >
      <div className="t-workspace-sheet" data-region="bottom">
        {isStatic ? null : bottom.content}
      </div>
    </BottomSheet>
  ) : null;

  const collapseLabel = leftCollapsed ? t("expandSidebar") : t("collapseSidebar");

  return (
    <ShellRoot
      shell="workspace"
      mainId={ids.main}
      contained={contained}
      ref={setRoot}
      onKeyDown={onKeyDown}
      data-t={isStatic ? "shell workspace" : undefined}
      data-ready={isStatic ? undefined : ""}
      data-storage-key={isStatic && storageKey !== false ? storageKey : undefined}
      data-panel-mode={panelMode === "float" ? undefined : panelMode}
      data-left-collapsed={hasLeft && leftCollapsed ? "" : undefined}
      data-bottom-collapsed={bottom && bottomCollapsed ? "" : undefined}
    >
      <ShellBar tabIndex={-1}>
        {hasLeft ? (
          <Tooltip text={collapseLabel}>
            <Button
              className="t-shell-collapse"
              variant="ghost"
              icon={<Glyph body={sidebarGlyph} />}
              label={collapseLabel}
              aria-expanded={!leftCollapsed}
              aria-controls={ids.left}
              onClick={toggleLeft}
            />
          </Tooltip>
        ) : null}
        {isStatic || phone ? menuSheet : null}
        <ShellBrandLink brand={brand} />
        <ShellSearch control={searchControl}>{search}</ShellSearch>
        {search ? <ShellSearchButton control={searchControl} /> : null}
        <ShellActions>
          {actions}
          {hasLeft ? null : <ShellTheme parts={theme} />}
          {hasLeft ? null : settingsPart()}
          {isStatic || phone ? panelSheets : null}
          {isStatic || phone ? bottomSheet : null}
        </ShellActions>
      </ShellBar>
      {hasLeft && desktop ? (
        <aside
          className="t-shell-sidebar"
          id={ids.left}
          aria-label={sidebarLabel}
          tabIndex={-1}
          onKeyDown={escapes(() => {
            update({ leftCollapsed: true });
            focusIn(".t-shell-collapse");
          })}
        >
          {sidebarParts}
          {handle("left", ids.left)}
        </aside>
      ) : null}
      {/* On a phone with the sheet closed, the app can still open the settings. */}
      {hasLeft && phone && sheet !== "left" ? settingsPart(false) : null}
      <ShellMain id={ids.main}>{children}</ShellMain>
      {desktop
        ? panels.map((panel) => (
            <aside
              key={panel.id}
              className="t-workspace-panel"
              id={ids.panel(panel.id)}
              data-panel={panel.id}
              aria-labelledby={`${ids.panel(panel.id)}-title`}
              tabIndex={-1}
              data-open={open === panel.id ? "" : undefined}
              onKeyDown={escapes(() => closePanel(panel.id))}
            >
              {handle("right", ids.panel(panel.id))}
              <header className="t-workspace-panel-header">
                <h2 className="t-workspace-title" id={`${ids.panel(panel.id)}-title`}>
                  {panel.label}
                </h2>
                {isStatic ? (
                  <ButtonLink
                    variant="ghost"
                    size="sm"
                    icon={<Glyph body={close} />}
                    label={t("close")}
                    to={`#${ids.main}`}
                    data-workspace-close=""
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Glyph body={close} />}
                    label={t("close")}
                    onClick={() => closePanel(panel.id)}
                  />
                )}
              </header>
              {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the body scrolls alone; the keyboard scrolls it once it has the focus. */}
              <div className="t-workspace-panel-body" tabIndex={0}>
                {panel.content}
              </div>
            </aside>
          ))
        : null}
      {desktop && panels.length > 0 ? (
        // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form fields; the rail is a group of toggle buttons.
        <div className="t-workspace-rail" role="group" aria-label={t("panels")}>
          {panels.map((panel) => (
            <Tooltip key={panel.id} text={panel.label} side="start">
              {isStatic ? (
                <ButtonLink
                  variant="ghost"
                  icon={<Icon name={panel.icon} />}
                  label={panel.label}
                  to={`#${ids.panel(panel.id)}`}
                  aria-controls={ids.panel(panel.id)}
                />
              ) : (
                <Button
                  variant="ghost"
                  icon={<Icon name={panel.icon} />}
                  label={panel.label}
                  aria-controls={ids.panel(panel.id)}
                  aria-pressed={open === panel.id}
                  onClick={() => togglePanel(panel.id)}
                />
              )}
            </Tooltip>
          ))}
        </div>
      ) : null}
      {bottom && desktop ? (
        <section
          className="t-workspace-bottom"
          id={ids.bottom}
          aria-labelledby={`${ids.bottom}-title`}
          tabIndex={-1}
        >
          {handle("bottom", ids.bottom)}
          <header className="t-workspace-bottom-header">
            <h2 className="t-workspace-title" id={`${ids.bottom}-title`}>
              {bottom.label}
            </h2>
            {bottom.actions ? <div className="t-workspace-actions">{bottom.actions}</div> : null}
            <Button
              variant="ghost"
              size="sm"
              icon={<Glyph body={bottomCollapsed ? chevronUp : chevronDown} />}
              label={bottomCollapsed ? t("expandPanel") : t("collapsePanel")}
              aria-expanded={!bottomCollapsed}
              aria-controls={ids.bottomBody}
              onClick={() => update({ bottomCollapsed: !bottomCollapsed })}
            />
          </header>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the body scrolls alone; the keyboard scrolls it once it has the focus. */}
          <div className="t-workspace-bottom-body" id={ids.bottomBody} tabIndex={0}>
            {bottom.content}
          </div>
        </section>
      ) : null}
    </ShellRoot>
  );
}

import { close, dash, windowDefault, windowMaximize, windowRestore } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  type Box,
  cascadePosition,
  clampBox,
  type Handle,
  keyAction,
  type Layout,
  moveBox,
  type Point,
  parseLayouts,
  resizeBox,
  type Size,
  toFront,
  withoutId,
  zIndex,
} from "@tailor/packs/windows/windows/logic";
import spec from "@tailor/packs/windows/windows/spec";
import {
  createContext,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  use,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../../core/button/button";
import { Glyph } from "../../glyph";

export interface WindowOptions {
  /** One window per id: opening an id that is open brings that window to the front. */
  id: string;
  title: string;
  /** An icon before the title, usually an Icon. */
  icon?: ReactNode;
  content: ReactNode;
  /** The size at the first open, in pixels. Default: a medium box. */
  size?: Size;
  /** The place at the first open, in pixels from the top left corner. Default: offset from the last window. */
  position?: Point;
  /** The least size, in pixels. Default: from the measure tokens. */
  minSize?: Size;
}

export interface WindowInfo {
  readonly id: string;
  readonly title: string;
  readonly minimized: boolean;
  readonly maximized: boolean;
}

export interface WindowsApi {
  open(options: WindowOptions): void;
  close(id: string): void;
  focus(id: string): void;
  minimize(id: string): void;
  restore(id: string): void;
  /** The open windows, in the order they opened. */
  readonly windows: readonly WindowInfo[];
}

interface WindowState extends WindowOptions {
  box: Box | null;
  minimized: boolean;
  maximized: boolean;
  /** The element that had the focus when the window opened. The close button returns the focus there. */
  opener: HTMLElement | null;
  onClose?: () => void;
}

interface Context {
  api: WindowsApi;
  openWith(options: WindowOptions, onClose: () => void): void;
  update(id: string, patch: Pick<WindowOptions, "title" | "icon" | "content">): void;
  /** Closes a window without telling its owner: for a Window that the app closed itself. */
  remove(id: string): void;
}

const WindowsContext = createContext<Context | null>(null);

const HANDLES = spec.props.handle;
const PHONE = "(max-width: 40rem)";
const isPhone = (): boolean => matchMedia(PHONE).matches;
const readStore = (key: string): Record<string, Layout> => {
  try {
    return parseLayouts(localStorage.getItem(key));
  } catch {
    return {};
  }
};

/** The least size that the stylesheet gives the window. */
const minOf = (element: HTMLElement): Size => {
  const style = getComputedStyle(element);
  return { width: Number.parseFloat(style.minWidth) || 0, height: Number.parseFloat(style.minHeight) || 0 };
};

export interface WindowsProviderProps {
  /** When set, the place and size of each window id are remembered in localStorage under this key. */
  storageKey?: string;
  children?: ReactNode;
}

/**
 * Holds the floating windows and draws them in a layer over the app, with a tray for the minimised ones.
 * Render it once, around the app. F6 and Shift+F6 move the focus between the page and the open windows.
 */
export function WindowsProvider({ storageKey, children }: WindowsProviderProps) {
  const [list, setList] = useState<WindowState[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, HTMLDivElement>());
  const current = useRef(list);
  current.current = list;
  const layouts = useRef<Record<string, Layout> | null>(null);
  const lastPlaced = useRef<Point | null>(null);
  const pageFocus = useRef<HTMLElement | null>(null);
  /** A window bar or tray bubble to focus after the next render. */
  const pendingFocus = useRef<{ id: string; where: "window" | "tray" } | null>(null);

  const key = useRef(storageKey);
  key.current = storageKey;

  useEffect(() => setHost(document.body), []);

  // The store reads only refs and setters, so its functions stay the same for the life of the provider.
  const { context, patch, raise } = useMemo(() => {
    const stored = (): Record<string, Layout> => {
      if (!key.current) return {};
      layouts.current ??= readStore(key.current);
      return layouts.current;
    };
    const patch = (id: string, change: Partial<WindowState>): void =>
      setList((prev) => prev.map((w) => (w.id === id ? { ...w, ...change } : w)));
    const raise = (id: string): void => setOrder((prev) => (prev.at(-1) === id ? prev : toFront(prev, id)));
    const openWith = (options: WindowOptions, onClose?: () => void): void => {
      const focused = document.activeElement;
      const opener = focused instanceof HTMLElement && !layer.current?.contains(focused) ? focused : null;
      const memory = stored()[options.id];
      const known = current.current.some((w) => w.id === options.id);
      setList((prev) => {
        if (prev.some((w) => w.id === options.id))
          return prev.map((w) => (w.id === options.id ? { ...w, ...options, minimized: false } : w));
        const box = memory ? { x: memory.x, y: memory.y, width: memory.width, height: memory.height } : null;
        return [
          ...prev,
          {
            ...options,
            box,
            minimized: memory?.minimized ?? false,
            maximized: memory?.maximized ?? false,
            opener,
            onClose,
          },
        ];
      });
      setOrder((prev) => toFront(prev, options.id));
      if (known || !memory?.minimized) pendingFocus.current = { id: options.id, where: "window" };
    };
    const close = (id: string, returnFocus = false, notify = true): void => {
      const closing = current.current.find((w) => w.id === id);
      if (!closing) return;
      setList((prev) => prev.filter((w) => w.id !== id));
      setOrder((prev) => withoutId(prev, id));
      setActive((prev) => (prev === id ? null : prev));
      if (returnFocus && closing.opener?.isConnected) closing.opener.focus();
      if (notify) closing.onClose?.();
    };
    const api: WindowsApi & { closeByUser(id: string): void } = {
      open: (options) => openWith(options),
      close: (id) => close(id),
      closeByUser: (id) => close(id, true),
      focus: (id) => {
        if (!current.current.some((w) => w.id === id)) return;
        patch(id, { minimized: false });
        raise(id);
        pendingFocus.current = { id, where: "window" };
      },
      minimize: (id) => {
        const element = elements.current.get(id);
        if (element?.contains(document.activeElement)) pendingFocus.current = { id, where: "tray" };
        patch(id, { minimized: true });
        setActive((prev) => (prev === id ? null : prev));
      },
      restore: (id) => {
        patch(id, { minimized: false });
        raise(id);
        pendingFocus.current = { id, where: "window" };
      },
      windows: [],
    };
    const context: Context & { api: typeof api } = {
      api,
      openWith,
      remove: (id) => close(id, false, false),
      update: (id, change) => {
        if (current.current.some((w) => w.id === id)) patch(id, change);
      },
    };
    return { context, patch, raise };
  }, []);

  const windows = useMemo(
    () => list.map(({ id, title, minimized, maximized }) => ({ id, title, minimized, maximized })),
    [list],
  );
  const value = useMemo<Context>(
    () => ({ ...context, api: { ...context.api, windows } }),
    [context, windows],
  );

  // Remember the layouts; a closed window keeps its last one for the next open.
  useEffect(() => {
    if (!storageKey) return;
    layouts.current ??= readStore(storageKey);
    const all = { ...layouts.current };
    for (const w of list) if (w.box) all[w.id] = { ...w.box, minimized: w.minimized, maximized: w.maximized };
    layouts.current = all;
    try {
      localStorage.setItem(storageKey, JSON.stringify(all));
    } catch {
      // Storage can be full or blocked; the layout then lasts for this page only.
    }
  }, [list, storageKey]);

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const scope = target.where === "window" ? elements.current.get(target.id) : tray.current;
    const selector =
      target.where === "window" ? ".t-window-bar" : `[data-window-id="${CSS.escape(target.id)}"] button`;
    const element = scope?.querySelector<HTMLElement>(selector);
    element?.focus();
  });

  useLayoutEffect(() => {
    tray.current?.style.setProperty("--t-window-z", String(order.length + 1));
  }, [order]);

  // Windows come back inside when the viewport gets smaller.
  useEffect(() => {
    const onResize = (): void => {
      const viewport = layer.current;
      if (!viewport) return;
      const size = { width: viewport.clientWidth, height: viewport.clientHeight };
      setList((prev) =>
        prev.map((w) => {
          const element = elements.current.get(w.id);
          if (!w.box || !element || isPhone()) return w;
          const box = clampBox(w.box, size, minOf(element));
          const same =
            box.x === w.box.x &&
            box.y === w.box.y &&
            box.width === w.box.width &&
            box.height === w.box.height;
          return same ? w : { ...w, box };
        }),
      );
    };
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  // The focus between the page and the windows: F6 and Shift+F6 cycle, and the page remembers its last element.
  useEffect(() => {
    const inWindow = (node: EventTarget | null): string | null => {
      if (!(node instanceof Node)) return null;
      for (const [id, element] of elements.current) if (element.contains(node)) return id;
      return null;
    };
    const onFocusIn = (event: FocusEvent): void => {
      const id = inWindow(event.target);
      if (id === null && !tray.current?.contains(event.target as Node)) {
        if (event.target instanceof HTMLElement) pageFocus.current = event.target;
        setActive(null);
      }
    };
    const onPointerDown = (event: globalThis.PointerEvent): void => {
      if (inWindow(event.target) === null) setActive(null);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== "F6" || event.defaultPrevented) return;
      const open = current.current.filter((w) => !w.minimized).map((w) => w.id);
      if (open.length === 0) return;
      event.preventDefault();
      const stops = [null, ...open];
      const here = stops.indexOf(inWindow(document.activeElement));
      const next = stops[(here + (event.shiftKey ? -1 : 1) + stops.length) % stops.length] ?? null;
      if (next === null) {
        const back = pageFocus.current;
        if (back?.isConnected) back.focus();
        else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }
      elements.current.get(next)?.querySelector<HTMLElement>(".t-window-bar")?.focus();
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const api = context.api;
  const minimized = list.filter((w) => w.minimized);

  const placeNew = (element: HTMLDivElement, w: WindowState): Box => {
    const viewport = {
      width: layer.current?.clientWidth ?? innerWidth,
      height: layer.current?.clientHeight ?? innerHeight,
    };
    const size = w.size ?? { width: element.offsetWidth, height: element.offsetHeight };
    const point = w.position ?? cascadePosition(lastPlaced.current, size, viewport);
    const box = clampBox({ ...point, ...size }, viewport, minOf(element));
    lastPlaced.current = box;
    return box;
  };

  return (
    <WindowsContext value={value}>
      {children}
      {host
        ? createPortal(
            <div className="t-windows" ref={layer} data-tray={minimized.length > 0 ? "" : undefined}>
              {list.map((w) => (
                <WindowFrame
                  key={w.id}
                  state={w}
                  z={zIndex(order, w.id)}
                  focused={active === w.id}
                  layer={layer}
                  elements={elements.current}
                  place={(element) => patch(w.id, { box: placeNew(element, w) })}
                  onBox={(box) => patch(w.id, { box })}
                  onActivate={() => {
                    raise(w.id);
                    setActive(w.id);
                  }}
                  onMinimize={() => api.minimize(w.id)}
                  onMaximize={() => patch(w.id, { maximized: !w.maximized })}
                  onClose={() => api.closeByUser(w.id)}
                />
              ))}
              {minimized.length > 0 ? (
                // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; the tray is a group of buttons.
                <div className="t-windows-tray" ref={tray} role="group" aria-label={t("windowsTray")}>
                  {minimized.map((w) => (
                    <div className="t-windows-bubble" key={w.id} data-window-id={w.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={
                          <span className="t-window-icon">{w.icon ?? <Glyph body={windowDefault} />}</span>
                        }
                        aria-label={`${t("windowRestore")} ${w.title}`}
                        onClick={() => api.restore(w.id)}
                      >
                        {w.title}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Glyph body={close} />}
                        label={`${t("close")} ${w.title}`}
                        onClick={() => api.closeByUser(w.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>,
            host,
          )
        : null}
    </WindowsContext>
  );
}

const useWindowsContext = (): Context => {
  const context = use(WindowsContext);
  if (!context) throw new Error("useWindows and Window need a WindowsProvider around them");
  return context;
};

/** The window manager of the nearest WindowsProvider. */
export function useWindows(): WindowsApi {
  const { api } = useWindowsContext();
  return api;
}

interface FrameProps {
  state: WindowState;
  z: number;
  focused: boolean;
  layer: { readonly current: HTMLDivElement | null };
  /** The provider's map of window elements, by window id. */
  elements: Map<string, HTMLDivElement>;
  place(element: HTMLDivElement): void;
  onBox(box: Box): void;
  onActivate(): void;
  onMinimize(): void;
  onMaximize(): void;
  onClose(): void;
}

interface Drag {
  pointer: number;
  x: number;
  y: number;
  box: Box;
  handle: Handle | null;
}

function WindowFrame({
  state,
  z,
  focused,
  layer,
  elements,
  place,
  onBox,
  onActivate,
  onMinimize,
  onMaximize,
  onClose,
}: FrameProps) {
  const { box, minimized, maximized, minSize, title, icon, content } = state;
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState(false);

  const placeLatest = useRef(place);
  placeLatest.current = place;

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    elements.set(state.id, element);
    return () => {
      elements.delete(state.id);
    };
  }, [elements, state.id]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const set = (name: string, value: string | null): void => {
      if (value === null) element.style.removeProperty(name);
      else element.style.setProperty(name, value);
    };
    set("--t-window-min-w", minSize ? `${minSize.width}px` : null);
    set("--t-window-min-h", minSize ? `${minSize.height}px` : null);
    set("--t-window-z", String(z));
    if (!box) {
      placeLatest.current(element);
      return;
    }
    set("--t-window-x", `${box.x}px`);
    set("--t-window-y", `${box.y}px`);
    set("--t-window-w", `${box.width}px`);
    set("--t-window-h", `${box.height}px`);
  }, [box, z, minSize]);

  const viewport = (): Size => ({
    width: layer.current?.clientWidth ?? innerWidth,
    height: layer.current?.clientHeight ?? innerHeight,
  });
  const fixed = (): boolean => maximized || isPhone();

  const start = (event: PointerEvent<HTMLDivElement>, handle: Handle | null): void => {
    if (event.button !== 0 || !box || fixed()) return;
    if (handle === null && (event.target as Element).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, box, handle };
    setDragging(true);
  };
  const follow = (event: PointerEvent<HTMLDivElement>): void => {
    const current = drag.current;
    const element = root.current;
    if (!current || current.pointer !== event.pointerId || !element) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    const min = minOf(element);
    onBox(
      current.handle
        ? resizeBox(current.box, current.handle, dx, dy, viewport(), min)
        : moveBox(current.box, dx, dy, viewport(), min),
    );
  };
  const end = (event: PointerEvent<HTMLDivElement>): void => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const pointer = (handle: Handle | null) => ({
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => start(event, handle),
    onPointerMove: follow,
    onPointerUp: end,
    onPointerCancel: end,
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey) return;
    const action = keyAction(event.key, event.shiftKey, event.altKey);
    const element = root.current;
    if (!action || !element || isPhone()) return;
    event.preventDefault();
    if (action.kind === "maximize") {
      onMaximize();
      return;
    }
    if (!box || maximized) return;
    const min = minOf(element);
    onBox(
      action.kind === "move"
        ? moveBox(box, action.dx, action.dy, viewport(), min)
        : resizeBox(box, "se", action.dx, action.dy, viewport(), min),
    );
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a window is a labelled group of content, not a form fieldset.
    <div
      ref={root}
      className="t-window"
      role="group"
      aria-labelledby={`${id}-title`}
      data-focused={focused ? "" : undefined}
      data-maximized={maximized ? "" : undefined}
      data-minimized={minimized ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      inert={minimized}
      onPointerDownCapture={onActivate}
      onFocus={onActivate}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: the bar is a focusable group that takes the move and resize keys. */}
      <div
        className="t-window-bar"
        role="group"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the bar takes the focus for the move and resize keys.
        tabIndex={0}
        aria-label={t("windowMove")}
        aria-describedby={`${id}-keys`}
        onKeyDown={onKeyDown}
        onDoubleClick={(event) => {
          if (!(event.target as Element).closest("button") && !isPhone()) onMaximize();
        }}
        {...pointer(null)}
      >
        <span className="t-window-icon">{icon ?? <Glyph body={windowDefault} />}</span>
        <h2 className="t-window-title" id={`${id}-title`}>
          {title}
        </h2>
        <span id={`${id}-keys`} hidden>
          {t("windowKeys")}
        </span>
        <div className="t-window-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={<Glyph body={dash} />}
            label={t("windowMinimize")}
            onClick={onMinimize}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Glyph body={maximized ? windowRestore : windowMaximize} />}
            label={maximized ? t("windowRestore") : t("windowMaximize")}
            data-window-action="maximize"
            onClick={onMaximize}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Glyph body={close} />}
            label={t("close")}
            onClick={onClose}
          />
        </div>
      </div>
      <WindowBody labelledBy={`${id}-title`}>{content}</WindowBody>
      {HANDLES.map((handle) => (
        <div
          key={handle}
          className="t-window-handle"
          data-handle={handle}
          aria-hidden="true"
          {...pointer(handle)}
        />
      ))}
    </div>
  );
}

/** The content box. It takes the focus only when it scrolls, so the keyboard can scroll it. */
function WindowBody({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const check = (): void =>
      setScrolls(
        element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1,
      );
    const sizes = new ResizeObserver(check);
    const watch = (): void => {
      sizes.observe(element);
      for (const child of element.children) sizes.observe(child);
      check();
    };
    const changes = new MutationObserver(watch);
    changes.observe(element, { childList: true, subtree: true, characterData: true });
    watch();
    return () => {
      sizes.disconnect();
      changes.disconnect();
    };
  }, []);
  return (
    <div
      ref={ref}
      className="t-window-body"
      {...(scrolls ? { tabIndex: 0, role: "region", "aria-labelledby": labelledBy } : {})}
    >
      {children}
    </div>
  );
}

export interface WindowProps extends Omit<WindowOptions, "content"> {
  open: boolean;
  /** Called with false when the user closes the window. Minimising keeps it open. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/** A window whose content lives in the React tree. Needs a WindowsProvider around it. */
export function Window({
  id,
  title,
  icon,
  size,
  position,
  minSize,
  open,
  onOpenChange,
  children,
}: WindowProps) {
  const { openWith, update, remove } = useWindowsContext();
  const change = useRef(onOpenChange);
  change.current = onOpenChange;

  // biome-ignore lint/correctness/useExhaustiveDependencies: opens and closes on `open`; the content follows below.
  useEffect(() => {
    if (!open) return;
    openWith({ id, title, icon, size, position, minSize, content: children }, () => change.current?.(false));
    return () => remove(id);
  }, [open, id]);

  useEffect(() => {
    if (open) update(id, { title, icon, content: children });
  }, [open, id, title, icon, children, update]);

  return null;
}

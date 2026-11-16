/** Frames of the site: a page of the same origin in an iframe that follows the theme, and an isolated React root. */
import type { ThemeState } from "@tailor/core/theme";
import { IconSprite } from "@tailor/react/core/icon/icon";
import { useTheme } from "@tailor/react/core/theme-pickers/theme-pickers";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { sendTheme, themeQuery } from "./state";

const isThemeState = (value: unknown): value is Partial<ThemeState> =>
  typeof value === "object" && value !== null;

const OVERLAYS = "dialog[open], [popover], .t-popup-positioner";

/** The height that shows the content and every open overlay of a frame's document. */
function contentHeight(doc: Document, body: HTMLElement): number {
  let height = body.getBoundingClientRect().height;
  const margin = doc.defaultView ? Number.parseFloat(getComputedStyle(doc.documentElement).fontSize) * 2 : 32;
  for (const overlay of doc.querySelectorAll(OVERLAYS)) {
    const box = overlay.getBoundingClientRect();
    if (
      box.height === 0 ||
      (overlay instanceof HTMLElement && overlay.matches("[popover]:not(:popover-open)"))
    )
      continue;
    // A dialog centres in the frame and needs its own height; a popup hangs from its trigger.
    height = Math.max(height, overlay.tagName === "DIALOG" ? box.height + 2 * margin : box.bottom + margin);
  }
  return height;
}

export interface FrameProps {
  /** A relative address of the site, without the theme parameters. */
  src: string;
  /** The accessible name of the frame. */
  label: string;
  /** A fixed size in CSS pixels; without one the frame takes the full width and the height of its content. */
  width?: number;
  height?: number;
}

/**
 * An iframe of the site. It starts in the current theme, follows every theme change, and passes a change
 * made inside it (its own theme controls) back to the site. Without a fixed height it grows with its content.
 */
export function Frame({ src, label, width, height }: FrameProps) {
  const theme = useTheme();
  const frame = useRef<HTMLIFrameElement>(null);
  // The address keeps the theme of the first paint; later changes go in as events, without a reload.
  const [address] = useState(() => `${src}${src.includes("?") ? "&" : "?"}${themeQuery(theme)}`);
  const [content, setContent] = useState<number | undefined>(undefined);
  const { set } = theme;
  const auto = height === undefined;
  const latest = useRef<ThemeState>(theme);
  latest.current = theme;

  useEffect(() => {
    if (frame.current) sendTheme(frame.current, theme);
  }, [theme]);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let stop = (): void => {};
    const attach = (): void => {
      stop();
      const win = element.contentWindow as (Window & typeof globalThis) | null;
      const doc = element.contentDocument;
      if (!win || !doc?.body) return;
      sendTheme(element, latest.current);
      const onTheme = (event: Event): void => {
        const detail: unknown = "detail" in event ? event.detail : undefined;
        if (isThemeState(detail)) set(detail);
      };
      doc.addEventListener("t:theme", onTheme);
      let observer: ResizeObserver | undefined;
      let popups: MutationObserver | undefined;
      if (auto) {
        const body = doc.body;
        const measure = (): void => setContent(Math.ceil(contentHeight(doc, body)));
        observer = new win.ResizeObserver(measure);
        observer.observe(body);
        // An open dialog or popup sits outside the flow: the frame grows while it is open.
        popups = new win.MutationObserver(measure);
        popups.observe(doc.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["open", "data-open", "hidden", "style"],
        });
        measure();
      }
      stop = () => {
        doc.removeEventListener("t:theme", onTheme);
        observer?.disconnect();
        popups?.disconnect();
      };
    };
    element.addEventListener("load", attach);
    if (element.contentDocument?.readyState === "complete") attach();
    return () => {
      element.removeEventListener("load", attach);
      stop();
    };
  }, [auto, set]);

  return (
    <iframe
      ref={frame}
      className="sc-frame"
      data-fit={width === undefined ? "" : undefined}
      src={address}
      title={label}
      width={width}
      height={height ?? content ?? 0}
    />
  );
}

/** Links in the examples do not navigate: the site has its own router, and the examples link to sample pages. */
const holdLinks = (event: Event): void => {
  if (event.target instanceof Element && event.target.closest("a[href]")) event.preventDefault();
};

/**
 * Renders the examples in a React root of their own, outside the site's router, as on the entry page:
 * their links and shells then behave as they do in a project without this site around them.
 */
export function Isolated({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<Root | null>(null);

  useLayoutEffect(() => {
    if (!host.current) return;
    const element = host.current;
    const created = createRoot(element);
    element.addEventListener("click", holdLinks, true);
    setRoot(created);
    return () => {
      element.removeEventListener("click", holdLinks, true);
      // Unmounting while the outer root renders is not allowed: wait for it to finish.
      queueMicrotask(() => created.unmount());
    };
  }, []);

  useLayoutEffect(() => {
    root?.render(<IconSprite href="tailor/icons.svg">{children}</IconSprite>);
  }, [root, children]);

  return <div className="sc-isolated" ref={host} />;
}

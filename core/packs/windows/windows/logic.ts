/**
 * The box maths of the floating windows. Plain TypeScript, no DOM.
 * Every value is in CSS pixels, relative to the top left corner of the viewport.
 */
import type spec from "./spec";

export type Handle = (typeof spec.props.handle)[number];

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Box extends Point, Size {}

export const WINDOW_DEFAULTS = {
  /** The part of the title bar that always stays inside the viewport. */
  visible: 48,
  /** The step of an arrow key, and with Shift. */
  step: 16,
  largeStep: 64,
  /** The place of the first window, and the offset of each next one. */
  origin: 48,
  cascade: 32,
} as const;

const between = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), Math.max(low, high));

/**
 * The box held inside the viewport: no larger than the viewport, no smaller than the minimum (or the
 * viewport, when that is smaller), with the top edge inside and at least `visible` pixels of the title bar on screen.
 */
export function clampBox(
  box: Box,
  viewport: Size,
  min: Size,
  visible: number = WINDOW_DEFAULTS.visible,
): Box {
  const width = between(box.width, Math.min(min.width, viewport.width), viewport.width);
  const height = between(box.height, Math.min(min.height, viewport.height), viewport.height);
  const strip = Math.min(visible, width);
  return {
    x: Math.round(between(box.x, strip - width, viewport.width - strip)),
    y: Math.round(between(box.y, 0, viewport.height - Math.min(visible, height))),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/** The box moved by a delta, then held inside the viewport. */
export function moveBox(box: Box, dx: number, dy: number, viewport: Size, min: Size): Box {
  return clampBox({ ...box, x: box.x + dx, y: box.y + dy }, viewport, min);
}

/**
 * The box after its handle moved by a delta. The opposite edge stays where it is. A dragged edge stops at
 * the minimum size and at the viewport edge (or where it already was, when it was outside).
 */
export function resizeBox(box: Box, handle: Handle, dx: number, dy: number, viewport: Size, min: Size): Box {
  let { x, y, width, height } = box;
  const right = x + width;
  const bottom = y + height;
  if (handle.includes("e")) {
    const edge = between(right + dx, x + min.width, Math.max(viewport.width, right));
    width = edge - x;
  } else if (handle.includes("w")) {
    const edge = between(x + dx, Math.min(0, x), right - min.width);
    x = edge;
    width = right - edge;
  }
  if (handle.includes("s")) {
    const edge = between(bottom + dy, y + min.height, Math.max(viewport.height, bottom));
    height = edge - y;
  } else if (handle.includes("n")) {
    const edge = between(y + dy, Math.min(0, y), bottom - min.height);
    y = edge;
    height = bottom - edge;
  }
  return clampBox({ x, y, width, height }, viewport, min);
}

/** The place of a new window: offset from the last one, back to the start when it would leave the viewport. */
export function cascadePosition(
  last: Point | null,
  size: Size,
  viewport: Size,
  step: number = WINDOW_DEFAULTS.cascade,
  origin: number = WINDOW_DEFAULTS.origin,
): Point {
  const start = {
    x: Math.max(0, Math.min(origin, viewport.width - size.width)),
    y: Math.max(0, Math.min(origin, viewport.height - size.height)),
  };
  if (!last) return start;
  const next = { x: last.x + step, y: last.y + step };
  const fits = next.x + size.width <= viewport.width && next.y + size.height <= viewport.height;
  return fits ? next : start;
}

export type KeyAction =
  | { readonly kind: "move"; readonly dx: number; readonly dy: number }
  | { readonly kind: "resize"; readonly dx: number; readonly dy: number }
  | { readonly kind: "maximize" };

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** What a key on the title bar does: arrows move, Alt+arrows resize from the bottom end corner, Enter maximises. */
export function keyAction(key: string, shift: boolean, alt: boolean): KeyAction | null {
  if (key === "Enter") return { kind: "maximize" };
  const arrow = ARROWS[key];
  if (!arrow) return null;
  const step = shift ? WINDOW_DEFAULTS.largeStep : WINDOW_DEFAULTS.step;
  return { kind: alt ? "resize" : "move", dx: arrow[0] * step, dy: arrow[1] * step };
}

/** The z-order: the ids from back to front. */
export const toFront = (order: readonly string[], id: string): string[] => [
  ...order.filter((other) => other !== id),
  id,
];

export const withoutId = (order: readonly string[], id: string): string[] =>
  order.filter((other) => other !== id);

/** The stacking level of a window: 1 for the back one. */
export const zIndex = (order: readonly string[], id: string): number => order.indexOf(id) + 1;

/** The layout of one window that a page remembers. */
export interface Layout extends Box {
  readonly minimized: boolean;
  readonly maximized: boolean;
}

const isLayout = (value: unknown): value is Layout => {
  if (value === null || typeof value !== "object") return false;
  const numbers = ["x", "y", "width", "height"].every((key) => Number.isFinite(Reflect.get(value, key)));
  return (
    numbers &&
    typeof Reflect.get(value, "minimized") === "boolean" &&
    typeof Reflect.get(value, "maximized") === "boolean"
  );
};

/** The stored layouts by window id, read from text. Anything that is not a valid layout is left out. */
export function parseLayouts(text: string | null): Record<string, Layout> {
  if (!text) return {};
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {};
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) return {};
  const layouts: Record<string, Layout> = {};
  for (const [id, value] of Object.entries(data)) if (isLayout(value)) layouts[id] = value;
  return layouts;
}

/**
 * The layout maths of the workspace shell, shared by both kits. Plain TypeScript, no DOM.
 * Sizes are in pixels; the bounds come from the measure tokens. The clamping and the arrow keys are the
 * split's, with the direction of each handle turned so that the arrow toward the centre always shrinks.
 */
import { clampSize, type SplitBounds, sizeFromKey } from "../../core/split/logic";

export type { SplitBounds } from "../../core/split/logic";

/** The three regions that resize. */
export type WorkspaceSide = "left" | "right" | "bottom";

/** The tokens of each region: its least, default and most size. */
export const SIZE_TOKENS: Readonly<Record<WorkspaceSide, readonly [string, string, string]>> = {
  left: ["--t-measure-xs", "--t-sidebar-w", "--t-measure-md"],
  right: ["--t-measure-xs", "--t-measure-sm", "--t-measure-lg"],
  bottom: ["--t-measure-2xs", "--t-measure-xs", "--t-measure-lg"],
};

/** The layout that the shell remembers. A missing value means "as the shell starts". */
export interface WorkspaceLayout {
  readonly left?: number;
  readonly leftCollapsed?: boolean;
  readonly panel?: string | null;
  readonly right?: number;
  readonly bottom?: number;
  readonly bottomCollapsed?: boolean;
}

const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
const bool = (value: unknown): boolean | undefined => (typeof value === "boolean" ? value : undefined);

/** The stored layout from its text; anything that is not a valid value is left out. */
export function parseLayout(text: string | null | undefined): WorkspaceLayout {
  if (!text) return {};
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {};
  }
  if (typeof value !== "object" || value === null) return {};
  const v = value as Record<string, unknown>;
  const layout: Record<string, unknown> = {
    left: num(v.left),
    leftCollapsed: bool(v.leftCollapsed),
    panel: typeof v.panel === "string" || v.panel === null ? v.panel : undefined,
    right: num(v.right),
    bottom: num(v.bottom),
    bottomCollapsed: bool(v.bottomCollapsed),
  };
  for (const key of Object.keys(layout)) if (layout[key] === undefined) delete layout[key];
  return layout as WorkspaceLayout;
}

/** A length token ("12rem", "240px") in pixels, or NaN for anything else. */
export function lengthToPx(text: string, rem: number): number {
  const match = /^\s*(-?[\d.]+)(rem|px)\s*$/.exec(text);
  if (!match) return Number.NaN;
  return Number(match[1]) * (match[2] === "rem" ? rem : 1);
}

/**
 * sizeFromKey grows on ArrowRight and ArrowDown. The panel grows toward the left and the bottom panel
 * upward, so their handles swap the arrows of their own axis.
 */
const SWAP: Record<WorkspaceSide, Readonly<Record<string, string>>> = {
  left: {},
  right: { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" },
  bottom: { ArrowUp: "ArrowDown", ArrowDown: "ArrowUp" },
};

/** The new size for a key on the handle of `side`, or null when the key does nothing. */
export function resizeByKey(
  side: WorkspaceSide,
  key: string,
  size: number,
  bounds: SplitBounds,
  step: number,
): number | null {
  return sizeFromKey(SWAP[side][key] ?? key, size, bounds, step);
}

/**
 * The size for a pointer while the handle of `side` is dragged. `edge` is the region's fixed edge: the
 * left of the sidebar, the right of the panel, the bottom of the bottom panel.
 */
export function resizeByPointer(
  side: WorkspaceSide,
  pointer: number,
  edge: number,
  bounds: SplitBounds,
): number {
  return clampSize(side === "left" ? pointer - edge : edge - pointer, bounds);
}

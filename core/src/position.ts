/** Where a popup goes next to its anchor, kept inside the viewport. Pure maths, no DOM. */

export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Placement {
  readonly x: number;
  readonly y: number;
  readonly side: Side;
  /** Room left for the popup on its side, for a max-height. */
  readonly available: number;
}

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

export function place(
  anchor: Box,
  popup: { readonly width: number; readonly height: number },
  viewport: { readonly width: number; readonly height: number },
  options: { side?: Side; align?: Align; gap?: number; margin?: number } = {},
): Placement {
  const { side = "bottom", align = "start", gap = 4, margin = 8 } = options;
  const room: Record<Side, number> = {
    top: anchor.y - gap - margin,
    bottom: viewport.height - (anchor.y + anchor.height) - gap - margin,
    left: anchor.x - gap - margin,
    right: viewport.width - (anchor.x + anchor.width) - gap - margin,
  };
  const vertical = side === "top" || side === "bottom";
  const need = vertical ? popup.height : popup.width;
  const chosen = room[side] >= need || room[side] >= room[OPPOSITE[side]] ? side : OPPOSITE[side];

  const along = (start: number, size: number, own: number): number =>
    align === "start" ? start : align === "end" ? start + size - own : start + (size - own) / 2;
  const clamp = (value: number, own: number, limit: number): number =>
    Math.max(margin, Math.min(value, limit - own - margin));

  let x: number;
  let y: number;
  if (chosen === "top" || chosen === "bottom") {
    x = clamp(along(anchor.x, anchor.width, popup.width), popup.width, viewport.width);
    y =
      chosen === "bottom"
        ? anchor.y + anchor.height + gap
        : anchor.y - gap - Math.min(popup.height, room.top);
  } else {
    y = clamp(along(anchor.y, anchor.height, popup.height), popup.height, viewport.height);
    x =
      chosen === "right" ? anchor.x + anchor.width + gap : anchor.x - gap - Math.min(popup.width, room.left);
  }
  return { x, y, side: chosen, available: Math.max(0, room[chosen]) };
}

/**
 * The colour logic of the colour picker, shared by both kits. Plain TypeScript, no DOM.
 * A value is "#rrggbb" in lower case. HSV: hue 0–360, saturation and value (brightness) 0–1.
 */

export interface Hsv {
  readonly h: number;
  readonly s: number;
  readonly v: number;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const clamp = (n: number, low: number, high: number): number => Math.min(high, Math.max(low, n));

/** A hex colour as "#rrggbb", from "#rgb", "rgb", "#rrggbb" or "rrggbb"; null for anything else. */
export function parseHex(text: string | null | undefined): string | null {
  const match = HEX.exec((text ?? "").trim());
  if (!match?.[1]) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return `#${digits.toLowerCase()}`;
}

export function hexToHsv(hex: string): Hsv {
  const value = parseHex(hex) ?? "#000000";
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(value.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number): string => {
    const k = (n + clamp(h, 0, 360) / 60) % 6;
    const c = clamp(v, 0, 1) - clamp(v, 0, 1) * clamp(s, 0, 1) * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

/** The colour at a point of the saturation/brightness area; x and y run 0–1 from the top left. */
export const fromArea = (hue: number, x: number, y: number): Hsv => ({
  h: hue,
  s: clamp(x, 0, 1),
  v: 1 - clamp(y, 0, 1),
});

/** The hue at a point of the hue slider, x 0–1. */
export const fromHue = (hsv: Hsv, x: number): Hsv => ({ ...hsv, h: clamp(x, 0, 1) * 360 });

const STEP = 0.01;
const BIG = 0.1;

/** Where a key moves the area thumb (left/right: saturation, up/down: brightness); null for other keys. */
export function moveArea(hsv: Hsv, key: string, shift = false): Hsv | null {
  const by = shift ? BIG : STEP;
  const moves: Record<string, () => Hsv> = {
    ArrowLeft: () => ({ ...hsv, s: clamp(hsv.s - by, 0, 1) }),
    ArrowRight: () => ({ ...hsv, s: clamp(hsv.s + by, 0, 1) }),
    ArrowUp: () => ({ ...hsv, v: clamp(hsv.v + by, 0, 1) }),
    ArrowDown: () => ({ ...hsv, v: clamp(hsv.v - by, 0, 1) }),
    PageUp: () => ({ ...hsv, v: clamp(hsv.v + BIG, 0, 1) }),
    PageDown: () => ({ ...hsv, v: clamp(hsv.v - BIG, 0, 1) }),
    Home: () => ({ ...hsv, s: 0 }),
    End: () => ({ ...hsv, s: 1 }),
  };
  return moves[key]?.() ?? null;
}

/** Where a key moves the hue thumb; null for other keys. */
export function moveHue(hsv: Hsv, key: string, shift = false): Hsv | null {
  const by = shift || key === "PageUp" || key === "PageDown" ? 10 : 1;
  const sign: Record<string, number> = {
    ArrowLeft: -1,
    ArrowDown: -1,
    PageDown: -1,
    ArrowRight: 1,
    ArrowUp: 1,
    PageUp: 1,
  };
  if (key === "Home") return { ...hsv, h: 0 };
  if (key === "End") return { ...hsv, h: 360 };
  const s = sign[key];
  return s === undefined ? null : { ...hsv, h: clamp(hsv.h + s * by, 0, 360) };
}

/** The value texts of the two sliders, as whole numbers. */
export const areaText = (hsv: Hsv): { s: number; v: number } => ({
  s: Math.round(hsv.s * 100),
  v: Math.round(hsv.v * 100),
});

/** Palettes: the colour values of the palette tokens, dark and light, and the contrast maths. */

export interface PaletteColors {
  readonly canvas: string;
  readonly inset: string;
  readonly surface: string;
  readonly selection: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly disabled: string;
  readonly accent: string;
  readonly accent_solid?: string;
  readonly on_accent: string;
  readonly link: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly extra: Readonly<Record<string, string>>;
  readonly neutrals?: readonly string[];
}

export interface PaletteSpec extends PaletteColors {
  readonly id: string;
  readonly name: string;
  readonly docs: string;
  readonly license: string;
  readonly mode: "dark" | "light";
  readonly light?: PaletteColors;
}

export type Mode = "dark" | "light";

const HUES = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"] as const;

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The colours of one mode of a palette. Every palette has both modes. */
export function paletteColors(p: PaletteSpec, mode: Mode): PaletteColors {
  if (mode === p.mode) return p;
  if (!p.light) throw new Error(`Palette ${p.id} has no ${mode} mode`);
  return p.light;
}

const toHex = (rgb: readonly number[]): string =>
  `#${rgb
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** A mix of two colours: 0 gives the first, 1 gives the second. */
export function mix(a: string, b: string, amount: number): string {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return toHex(x.map((v, i) => v + ((y[i] ?? v) - v) * amount));
}

const linear = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const gamma = (v: number): number => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

/** sRGB hex to OKLCH: lightness, chroma, hue. */
function toOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => linear(v / 255)) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

/** OKLCH to sRGB hex. A colour outside sRGB loses chroma until it fits, so its hue stays. */
function fromOklch(L: number, chroma: number, hue: number): string {
  for (let c = chroma; ; c *= 0.92) {
    const A = c * Math.cos(hue);
    const B = c * Math.sin(hue);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    if (c < 0.002 || rgb.every((v) => v >= -0.0005 && v <= 1.0005))
      return toHex(rgb.map((v) => gamma(Math.max(0, Math.min(1, v))) * 255));
  }
}

/**
 * The colour made lighter or darker, just far enough to reach the ratio on every background.
 * It keeps its hue, so a red stays a red. A colour that already passes keeps its value.
 */
export function readable(
  color: string,
  backgrounds: readonly string[],
  direction: "lighter" | "darker",
  min = 4.5,
): string {
  const worst = (c: string): number => Math.min(...backgrounds.map((bg) => contrast(c, bg)));
  if (worst(color) >= min) return color;
  const [lightness, chroma, hue] = toOklch(color);
  let low = lightness;
  let high = direction === "lighter" ? 1 : 0;
  for (let i = 0; i < 14; i++) {
    const middle = (low + high) / 2;
    if (worst(fromOklch(middle, chroma, hue)) >= min) high = middle;
    else low = middle;
  }
  return fromOklch(high, chroma, hue);
}

const TEXT_TONES = ["accent", "success", "warning", "danger", "info"] as const;
const FILL_TONES = ["success", "warning", "danger", "info"] as const;

/**
 * The tokens of one mode. Besides the palette's own values, it gives guarded values: text colours that stay
 * readable on every surface (WCAG 2.2 AA, 4.5:1) and control lines that stay visible (3:1).
 */
export function tokenPairs(c: PaletteColors, mode: Mode): [string, string][] {
  const neutrals = c.neutrals ?? [];
  const beyond = neutrals.find((n) =>
    mode === "dark" ? luminance(n) < luminance(c.inset) : luminance(n) > luminance(c.surface),
  );
  const surfaces = [c.canvas, c.surface, c.inset];
  // Text moves away from the surfaces: lighter in a dark mode, darker in a light one.
  const away = luminance(c.text) > luminance(c.canvas) ? "lighter" : "darker";
  const onSurfaces = (color: string, backgrounds: readonly string[] = surfaces, min = 4.5): string =>
    readable(color, backgrounds, away, min);

  const pairs: [string, string][] = [
    ["--t-canvas", c.canvas],
    ["--t-inset", c.inset],
    ["--t-surface", c.surface],
    ["--t-selection", readable(c.selection, [c.text], away === "lighter" ? "darker" : "lighter")],
    ["--t-border", c.border],
    ["--t-border-control", onSurfaces(c.border, surfaces, 3)],
    ["--t-overlay-bg", beyond ?? (mode === "dark" ? c.inset : c.text)],
    ["--t-text", c.text],
    ["--t-muted", onSurfaces(c.muted)],
    ["--t-disabled", c.disabled],
    ["--t-accent", c.accent],
    ["--t-accent-solid", c.accent_solid ?? c.accent],
    ["--t-on-accent", c.on_accent],
    ["--t-focus", onSurfaces(c.accent, surfaces, 3)],
    ["--t-link", onSurfaces(c.link)],
    ["--t-success", c.success],
    ["--t-warning", c.warning],
    ["--t-danger", c.danger],
    ["--t-info", c.info],
  ];
  for (const tone of TEXT_TONES) {
    // Text in a tone colour also sits on tints of that tone, so those count as backgrounds too.
    const tints = surfaces.map((surface) => mix(surface, c[tone], 0.2));
    pairs.push([`--t-${tone}-text`, onSurfaces(c[tone], [...surfaces, ...tints])]);
  }
  for (const tone of FILL_TONES) {
    // Text on a tone fill goes to the side, light or dark, that can reach the ratio at all.
    const light = contrast("#ffffff", c[tone]) >= contrast("#000000", c[tone]);
    const [first, second] = luminance(c.canvas) > luminance(c.text) ? [c.canvas, c.text] : [c.text, c.canvas];
    pairs.push([`--t-on-${tone}`, readable(light ? first : second, [c[tone]], light ? "lighter" : "darker")]);
  }
  for (const hue of HUES) {
    const value = c.extra[hue];
    if (value) pairs.push([`--t-hue-${hue}`, value]);
  }
  return pairs;
}

export function paletteCss(p: PaletteSpec): string {
  const block = (selector: string, mode: Mode): string =>
    `  ${selector} {\n    color-scheme: ${mode};\n${tokenPairs(paletteColors(p, mode), mode)
      .map(([k, v]) => `    ${k}: ${v};`)
      .join("\n")}\n  }\n`;
  const other: Mode = p.mode === "dark" ? "light" : "dark";
  return (
    `/* ${p.name}. Colour values from ${p.docs} (${p.license}). Generated from the palette source: do not edit. */\n` +
    `@layer t.palette {\n${block(`[data-palette="${p.id}"]`, p.mode)}${block(`[data-palette="${p.id}"][data-mode="${other}"]`, other)}}\n`
  );
}

/** The pairs every palette must keep readable, with the lowest ratio allowed (WCAG 2.2 AA). */
export const CONTRAST_FLOORS: readonly { fg: keyof PaletteColors; bg: keyof PaletteColors; min: number }[] = [
  { fg: "text", bg: "canvas", min: 4.5 },
  { fg: "text", bg: "surface", min: 4.5 },
  { fg: "text", bg: "inset", min: 4.5 },
  { fg: "on_accent", bg: "accent_solid", min: 4.5 },
  { fg: "success", bg: "canvas", min: 3 },
  { fg: "warning", bg: "canvas", min: 3 },
  { fg: "danger", bg: "canvas", min: 3 },
  { fg: "info", bg: "canvas", min: 3 },
];

export function paletteContrastProblems(p: PaletteSpec): string[] {
  const problems: string[] = [];
  for (const mode of ["dark", "light"] as const) {
    const c = paletteColors(p, mode);
    for (const { fg, bg, min } of CONTRAST_FLOORS) {
      const a = (c[fg] ?? c.accent) as string;
      const b = (c[bg] ?? c.accent) as string;
      const ratio = contrast(a, b);
      if (ratio < min) problems.push(`${p.id} ${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)}, below ${min}`);
    }
  }
  return problems;
}

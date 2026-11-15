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

export function tokenPairs(c: PaletteColors, mode: Mode): [string, string][] {
  const neutrals = c.neutrals ?? [];
  const beyond = neutrals.find((n) =>
    mode === "dark" ? luminance(n) < luminance(c.inset) : luminance(n) > luminance(c.surface),
  );
  const pairs: [string, string][] = [
    ["--t-canvas", c.canvas],
    ["--t-inset", c.inset],
    ["--t-surface", c.surface],
    ["--t-selection", c.selection],
    ["--t-border", c.border],
    ["--t-overlay-bg", beyond ?? (mode === "dark" ? c.inset : c.text)],
    ["--t-text", c.text],
    ["--t-muted", c.muted],
    ["--t-disabled", c.disabled],
    ["--t-accent", c.accent],
    ["--t-accent-solid", c.accent_solid ?? c.accent],
    ["--t-on-accent", c.on_accent],
    ["--t-link", c.link],
    ["--t-success", c.success],
    ["--t-warning", c.warning],
    ["--t-danger", c.danger],
    ["--t-info", c.info],
  ];
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
  { fg: "muted", bg: "canvas", min: 4.5 },
  { fg: "on_accent", bg: "accent_solid", min: 4.5 },
  { fg: "link", bg: "canvas", min: 4.5 },
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

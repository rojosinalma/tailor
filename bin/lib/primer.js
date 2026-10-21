// tailor — Primer theme emitter. Derives a @primer/primitives colour theme from the stock `dark` theme and a
// canonical palette's `primer` section: every token value is renamed (theme selectors) and recoloured:
//   1. per-token overrides      palette.primer.tokens["--fgColor-link"] = "#8be9fd"
//   2. exact colour map         palette.primer.map["#0d1117"] = "#282a36"
//   3. nearest palette colour   low-chroma → neutrals ramp by lightness,
//                               chromatic  → nearest `roles` hue (or a forced hue band), lightness preserved (OKLCH)
// var(), color-mix(), transparent and non-colour values pass through untouched. Bun, no dependencies.
//
// The output is byte-stable: the same palette + the same base CSS always give the same file.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, listSourcePalettes, loadPalette, paletteModes, mix } from "./common.js";

export const PRIMER_THEMES_OUT = join(ROOT, "react", "adapters", "primer", "themes");
export const PRIMER_BASE = "dark";

// Where the stock Primer theme CSS comes from: the pinned @primer/primitives in react/ (bun install there),
// or a directory of functional theme CSS files named by TAILOR_PRIMER_PRIMITIVES.
export function primerThemesDir() {
  const dir = process.env.TAILOR_PRIMER_PRIMITIVES
    || join(ROOT, "react", "node_modules", "@primer", "primitives", "dist", "css", "functional", "themes");
  return existsSync(join(dir, `${PRIMER_BASE}.css`)) ? dir : null;
}
export function primerMissingMessage() {
  return `@primer/primitives not found (looked for ${PRIMER_BASE}.css in ${process.env.TAILOR_PRIMER_PRIMITIVES || "react/node_modules/@primer/primitives/dist/css/functional/themes"}) — run \`bun install\` in react/ or set TAILOR_PRIMER_PRIMITIVES to a directory of Primer functional theme CSS files`;
}
export function primerVersion() {
  const f = join(ROOT, "react", "node_modules", "@primer", "primitives", "package.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).version : null;
}
export const primerThemeName = (p) => `${p.mode}_${p.id}`;
export const listPrimerPalettes = () => listSourcePalettes().filter((id) => loadPalette(id).primer);
// Every theme a palette yields: its own mode (hand-tuned `primer` section) + the counterpart mode when the
// palette carries one (derived from the counterpart block, see counterpartPrimerPalette).
export const primerThemeModes = (p) => paletteModes(p);
export const listPrimerThemeFiles = () =>
  existsSync(PRIMER_THEMES_OUT) ? readdirSync(PRIMER_THEMES_OUT).filter((f) => /^(dark|light)_[a-z0-9-]+\.css$/.test(f)).sort() : [];

// ---------- colour maths (sRGB <-> OKLab/OKLCH) ----------
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : null;
  return { rgb, alpha };
}
const rgbToHex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function rgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map((v) => srgbToLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}
function oklabToRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [lr, lg, lb].map((v) => linearToSrgb(v) * 255);
}
const inGamut = (rgb) => rgb.every((v) => v >= -0.5 && v <= 255.5);
function toOklch(hex) {
  const { L, a, b } = rgbToOklab(hexToRgb(hex).rgb);
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- the mapper for one palette ----------
function makeMapper(palette) {
  const cfg = palette.primer;
  if (!cfg) throw new Error(`palette ${palette.id} has no \`primer\` section`);
  const norm = (hex) => hex.toLowerCase();
  const exactMap = Object.fromEntries(Object.entries(cfg.map ?? {}).filter(([k]) => k.startsWith("#")).map(([k, v]) => [norm(k), norm(v)]));
  const tokenOverrides = Object.fromEntries(Object.entries(cfg.tokens ?? {}).filter(([k]) => k.startsWith("--")));
  const roles = palette.roles.map(norm).map((hex) => ({ hex, ...toOklch(hex) }));
  const neutrals = palette.neutrals.map(norm).map((hex) => ({ hex, ...toOklch(hex) })).sort((a, b) => a.L - b.L);
  const NEUTRAL_C = cfg.neutral_chroma_max ?? 0.035;
  const CHROMA_BOOST = cfg.chroma_boost ?? 1.25;
  const hueRanges = cfg.hue_ranges ?? [];
  const CANVAS = norm(palette.canvas);
  const LIGHT = palette.mode === "light";
  const DARK_TINT_MAX_L = cfg.dark_tint_max_L ?? 0.4;
  const LIGHT_TINT_MIN_L = cfg.light_tint_min_L ?? 0.9;
  const SHADOW = cfg.shadow_color ? norm(cfg.shadow_color) : null;
  const CANVAS_L = toOklch(CANVAS).L;
  const labs = neutrals.map((n) => ({ L: n.L, ...rgbToOklab(hexToRgb(n.hex).rgb) }));

  function nearestNeutral(src) {
    // Pick by lightness only, so the grey ramp keeps its ordering.
    let best = neutrals[0];
    for (const n of neutrals) if (Math.abs(n.L - src.L) < Math.abs(best.L - src.L)) best = n;
    return best.hex;
  }
  // Interpolate the neutral ramp (in OKLab) at lightness L.
  function neutralLabAt(L) {
    if (L <= labs[0].L) return labs[0];
    if (L >= labs.at(-1).L) return labs.at(-1);
    for (let i = 1; i < labs.length; i++) {
      if (L <= labs[i].L) {
        const t = (L - labs[i - 1].L) / (labs[i].L - labs[i - 1].L || 1);
        return { L, a: labs[i - 1].a + t * (labs[i].a - labs[i - 1].a), b: labs[i - 1].b + t * (labs[i].b - labs[i - 1].b) };
      }
    }
    return labs.at(-1);
  }
  // Shrink the chroma vector toward the neutral axis until the colour fits sRGB.
  function oklabToHexClipped({ L, a, b }) {
    let rgb, k = 1;
    for (let i = 0; i < 40; i++) {
      rgb = oklabToRgb({ L, a: a * k, b: b * k });
      if (inGamut(rgb)) break;
      k *= 0.92;
    }
    return rgbToHex(rgb.map((v) => Math.min(255, Math.max(0, v))));
  }
  function nearestRole(src) {
    let role = null;
    for (const r of hueRanges) {
      const inRange = r.min <= r.max ? src.h >= r.min && src.h <= r.max : src.h >= r.min || src.h <= r.max;
      if (inRange) { role = roles.find((x) => x.hex === norm(r.color)) ?? { hex: norm(r.color), ...toOklch(r.color) }; break; }
    }
    if (!role) {
      role = roles[0];
      for (const r of roles) if (hueDist(r.h, src.h) < hueDist(role.h, src.h)) role = r;
    }
    // Tints (label/muted backgrounds — near-black on a dark base, near-white on a light one): mix the role
    // colour over the canvas instead of trying to hit the source's extreme lightness, which would clip to a
    // pure primary.
    if (LIGHT ? src.L > LIGHT_TINT_MIN_L : src.L < DARK_TINT_MAX_L) {
      const w = Math.min(0.45, Math.max(0.15, 0.2 + (LIGHT ? 0.97 - src.L : src.L - 0.22) * 1.5));
      const c = rgbToOklab(hexToRgb(CANVAS).rgb);
      const r = rgbToOklab(hexToRgb(role.hex).rgb);
      return oklabToHexClipped({ L: c.L + (LIGHT ? -w * 0.3 : w * 0.3), a: c.a + (r.a - c.a) * w, b: c.b + (r.b - c.b) * w });
    }
    // Same hue family as the role at the source's lightness, laid over the palette neutral of that
    // lightness so near-neutral colours keep the palette's cast instead of clipping to a pure primary.
    const C = Math.min(role.C, src.C * CHROMA_BOOST);
    const base = neutralLabAt(src.L);
    const cast = Math.max(0, 1 - C / 0.08);
    const rad = (role.h * Math.PI) / 180;
    return oklabToHexClipped({ L: src.L, a: base.a * cast + C * Math.cos(rad), b: base.b * cast + C * Math.sin(rad) });
  }

  const cache = new Map(); // source 6-hex -> { hex, method }
  function mapRgbHex(hex6) {
    const key = norm(hex6);
    if (cache.has(key)) return cache.get(key);
    let result;
    if (exactMap[key]) result = { hex: exactMap[key], method: "exact" };
    else {
      const src = toOklch(key);
      result = src.C < NEUTRAL_C ? { hex: nearestNeutral(src), method: "nearest-neutral" } : { hex: nearestRole(src), method: "nearest-role" };
    }
    cache.set(key, result);
    return result;
  }
  return { mapRgbHex, tokenOverrides, SHADOW, CANVAS_L, toOklch, hexToRgb, rgbToHex };
}

// ---------- rewrite one theme file ----------
const HEX_RE = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const RGBA_RE = /rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)/g;
const DECL_RE = /^(\s*)(--[A-Za-z0-9_-]+)\s*:\s*([^;]*?)\s*;(.*)$/;

/**
 * Turn the stock `<base>.css` text into the palette's theme. Returns { css, stats, sourceCount, name }.
 * `name` defaults to `<mode>_<id>`; Primer React derives the colour mode from that prefix.
 */
export function primerThemeCss(palette, baseCss, { base = PRIMER_BASE, name = primerThemeName(palette) } = {}) {
  const m = makeMapper(palette);
  const stats = { tokens: 0, overridden: 0, exact: 0, nearest: 0, passthrough: 0 };
  const sourceCount = new Map();
  let currentToken = "";
  const isShadowToken = () => m.SHADOW && /shadow/i.test(currentToken);

  function mapHexToken(match) {
    const { rgb, alpha } = m.hexToRgb(match);
    if (alpha === 0) { stats.passthrough++; return match; } // fully transparent: colour irrelevant
    const hex6 = m.rgbToHex(rgb);
    sourceCount.set(hex6, (sourceCount.get(hex6) ?? 0) + 1);
    let { hex, method } = m.mapRgbHex(hex6);
    if (isShadowToken() && m.toOklch(hex).L < m.CANVAS_L - 0.01) { hex = m.SHADOW; method = "shadow"; }
    method === "exact" || method === "shadow" ? stats.exact++ : stats.nearest++;
    if (alpha === null) return hex;
    return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
  }
  function mapRgbaToken(_m, r, g, b, a) {
    const hex6 = m.rgbToHex([+r, +g, +b]);
    sourceCount.set(hex6, (sourceCount.get(hex6) ?? 0) + 1);
    const { hex, method } = m.mapRgbHex(hex6);
    method === "exact" ? stats.exact++ : stats.nearest++;
    const [nr, ng, nb] = m.hexToRgb(hex).rgb;
    return a === undefined ? `rgb(${nr}, ${ng}, ${nb})` : `rgba(${nr}, ${ng}, ${nb}, ${a})`;
  }
  function rewriteValue(token, value) {
    currentToken = token;
    if (/color-mix\(/.test(value)) { stats.passthrough++; return value; }
    if (!HEX_RE.test(value) && !RGBA_RE.test(value)) { stats.passthrough++; return value; }
    HEX_RE.lastIndex = 0; RGBA_RE.lastIndex = 0;
    return value.replace(HEX_RE, mapHexToken).replace(RGBA_RE, mapRgbaToken);
  }

  const themeAttr = new RegExp(`data-(dark|light)-theme="${escapeRe(base)}"`, "g");
  const lines = baseCss.split("\n").map((line) => {
    if (themeAttr.test(line)) { themeAttr.lastIndex = 0; return line.replace(themeAttr, `data-$1-theme="${name}"`); }
    const d = line.match(DECL_RE);
    if (!d) return line;
    const [, indent, token, value, rest] = d;
    stats.tokens++;
    if (Object.hasOwn(m.tokenOverrides, token)) { stats.overridden++; return `${indent}${token}: ${m.tokenOverrides[token]};${rest}`; }
    return `${indent}${token}: ${rewriteValue(token, value)};${rest}`;
  });
  const header = `/**\n * ${name} — generated from @primer/primitives theme "${base}" by gen-primer-theme.\n * Do not edit by hand: tune the palette file and regenerate.\n */\n`;
  return { css: header + lines.join("\n"), stats, sourceCount, name, base, mapRgbHex: m.mapRgbHex };
}

/** Generate the theme for one palette id (or loaded palette). Throws when primitives or the primer section are missing.
 *  `mode` picks the theme: the palette's own mode (default) or its counterpart (`light` for a dark palette with a
 *  `light` block), which is derived by counterpartPrimerPalette from that block and the stock base of that mode. */
export function generatePrimerTheme(ref, opts = {}) {
  let palette = typeof ref === "string" ? loadPalette(ref) : ref;
  const dir = primerThemesDir();
  if (!dir) throw new Error(primerMissingMessage());
  const mode = opts.mode ?? palette.mode;
  const base = opts.base ?? mode;
  const baseFile = join(dir, `${base}.css`);
  if (!existsSync(baseFile)) throw new Error(`Primer base theme ${base}.css not found in ${dir}`);
  const baseCss = readFileSync(baseFile, "utf8");
  if (mode !== palette.mode) palette = counterpartPrimerPalette(palette, baseCss);
  return primerThemeCss(palette, baseCss, { ...opts, base });
}

// The stock base's own surface/text colours, read from its declarations (var() references skipped).
function baseColours(baseCss) {
  const pick = (token) => baseCss.match(new RegExp(`^\\s*${token}:\\s*(#[0-9a-fA-F]{6})\\b`, "m"))?.[1]?.toLowerCase();
  return { canvas: pick("--bgColor-default"), inset: pick("--bgColor-muted"), border: pick("--borderColor-default"), text: pick("--fgColor-default"), muted: pick("--fgColor-muted"), disabled: pick("--fgColor-disabled"), accent: pick("--fgColor-accent") };
}

/**
 * A palette's counterpart block (`light` on a dark palette) as a palette the mapper can use, with a `primer`
 * section derived mechanically from the hand-tuned one: the same chroma thresholds, every hue band's target
 * swapped for the counterpart colour of the same role, an exact map of the stock base surfaces/text onto
 * the block's surfaces/text, and the link + primary-button tokens built from the block's link/accent.
 * Hand-tuning stays in the palette's own mode; the counterpart follows it.
 */
export function counterpartPrimerPalette(p, baseCss) {
  const mode = p.mode === "dark" ? "light" : "dark";
  const c = p[mode];
  if (!c) throw new Error(`palette ${p.id} has no ${mode} block`);
  if (!p.primer) throw new Error(`palette ${p.id} has no \`primer\` section`);
  const norm = (h) => h.toLowerCase();
  const semantic = ["accent", "link", "success", "warning", "danger", "info"];
  const roleOf = (hex) => {
    hex = norm(hex);
    for (const k of semantic) if (p[k] && norm(p[k]) === hex) return c[k];
    for (const [k, v] of Object.entries(p.extra ?? {})) if (norm(v) === hex && c.extra?.[k]) return c.extra[k];
    const src = toOklch(hex);
    let best = null;
    for (const r of roles) if (!best || hueDist(toOklch(r).h, src.h) < hueDist(toOklch(best).h, src.h)) best = r;
    return best;
  };
  const uniq = (xs) => [...new Set(xs.filter(Boolean).map(norm))];
  const roles = uniq([...semantic.map((k) => c[k]), ...Object.values(c.extra ?? {})]);
  const neutrals = uniq([...(c.neutrals ?? []), c.canvas, c.inset, c.surface, c.selection, c.border, c.text, c.muted, c.disabled]);
  const base = baseColours(baseCss);
  const map = {};
  for (const [k, hex] of Object.entries(base)) if (hex && c[k]) map[hex] = norm(c[k]);
  const solid = norm(c.accent_solid ?? c.accent), on = norm(c.on_accent), text = norm(c.text), canvas = norm(c.canvas);
  const tokens = {
    "--fgColor-link": norm(c.link),
    "--fgColor-danger": norm(c.danger),
    "--button-primary-bgColor-rest": solid,
    "--button-primary-bgColor-hover": mix(solid, text, 0.08),
    "--button-primary-bgColor-active": mix(solid, text, 0.16),
    "--button-primary-bgColor-disabled": mix(solid, canvas, 0.5),
    "--button-primary-borderColor-disabled": mix(solid, canvas, 0.5),
    "--button-primary-fgColor-rest": on,
    "--button-primary-iconColor-rest": on,
    "--button-primary-fgColor-disabled": `${on}99`,
    "--buttonCounter-primary-bgColor-rest": `${on}33`,
    "--buttonKeybindingHint-primary-fgColor-rest": on,
    "--buttonKeybindingHint-primary-bgColor-disabled": `${on}1a`,
    "--buttonKeybindingHint-primary-borderColor-rest": `${on}1a`,
  };
  const d = p.primer;
  const primer = { neutral_chroma_max: d.neutral_chroma_max, chroma_boost: d.chroma_boost, hue_ranges: (d.hue_ranges ?? []).map((r) => ({ min: r.min, max: r.max, color: roleOf(r.color) })), map, tokens };
  return { ...p, ...c, id: p.id, name: p.name, mode, roles, neutrals, primer };
}

// The adapter's index.ts: side-effect imports of every theme + the list and labels a consumer needs.
// One entry per palette × mode (dark_<id> and, when the palette has a light block, light_<id>).
export function primerThemesIndexTs(palettes) {
  const themes = palettes.flatMap((p) => primerThemeModes(p).map((mode) => ({ name: `${mode}_${p.id}`, label: p.name })));
  const rows = themes.map((t) => `  ${JSON.stringify(t.name)}: ${JSON.stringify(t.label)},`).join("\n");
  const imports = themes.map((t) => `import "./${t.name}.css";`).join("\n");
  return `// Generated by bin/gen-primer-theme --all — do not edit, run bin/build.
// Importing this module registers every tailor palette as a Primer Primitives theme (one CSS file each,
// scoped to [data-color-mode][data-dark-theme="<name>"]); pick one with PRIMER_THEMES / primerThemeProps.
// For apps on Primer React; tailor-react itself does not use Primer.
${imports}

/** Theme name → palette name. Names carry the colour mode prefix Primer React reads (dark_x / light_x). */
export const PRIMER_THEME_LABELS: Record<string, string> = {
${rows}
};
export const PRIMER_THEMES = Object.keys(PRIMER_THEME_LABELS);

/** Primer React ThemeProvider props selecting one generated theme (the other half stays the stock Primer theme). */
export type PrimerThemeProps = { colorMode: "light" | "dark"; dayScheme: string; nightScheme: string };
export function primerThemeProps(theme: string): PrimerThemeProps {
  return theme.startsWith("light")
    ? { colorMode: "light", dayScheme: theme, nightScheme: "dark" }
    : { colorMode: "dark", dayScheme: "light", nightScheme: theme };
}

/** Mirror the same choice onto <html>, so the page background and portalled overlays follow. */
export function applyPrimerTheme(theme: string, root: HTMLElement = document.documentElement): void {
  const props = primerThemeProps(theme);
  root.setAttribute("data-color-mode", props.colorMode);
  root.setAttribute("data-light-theme", props.dayScheme);
  root.setAttribute("data-dark-theme", props.nightScheme);
}
`;
}

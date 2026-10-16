// tailor — shared helpers for bin/*: paths, canonical palette loading, colour math, tiny JSON-schema
// validation, CSS brace check. Bun, no dependencies.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CORE = join(ROOT, "core");
export const SKINS = join(ROOT, "skins");
export const PALETTES_OUT = join(ROOT, "palettes");
export const SHOWCASE = join(ROOT, "showcase");

// Canonical palette sources (palettes/src/<id>.json + palette.schema.json) live in this repo; generated CSS
// goes to palettes/<id>.css. Override the source dir with TAILOR_PALETTES.
export const PALETTES_SRC = process.env.TAILOR_PALETTES || join(ROOT, "palettes", "src");

export const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));
export const VERSION = readJson(join(ROOT, "package.json")).version;

// ---------- colour ----------
export const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgbToHex = (rgb) =>
  "#" + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
export const mix = (a, b, t) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));
export function luminance(h) {
  const [r, g, b] = hexToRgb(h).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ---------- JSON schema subset (type, enum, pattern, required, properties, additionalProperties, items, minItems, $ref to $defs, const, minLength) ----------
export function validate(obj, schema, root = schema, path = "$") {
  const errs = [];
  if (schema.$ref) return validate(obj, root.$defs[schema.$ref.split("/").pop()], root, path);
  if (schema.const !== undefined && obj !== schema.const) errs.push(`${path}: expected ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(obj)) errs.push(`${path}: expected one of ${schema.enum.join("|")}`);
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const actual = Array.isArray(obj) ? "array" : obj === null ? "null" : typeof obj === "number" && Number.isInteger(obj) ? "integer" : typeof obj;
  if (types.length && !types.includes(actual) && !(actual === "integer" && types.includes("number"))) {
    errs.push(`${path}: expected ${types.join("|")}, got ${actual}`);
    return errs;
  }
  if (typeof obj === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(obj)) errs.push(`${path}: "${obj}" does not match ${schema.pattern}`);
    if (schema.minLength && obj.length < schema.minLength) errs.push(`${path}: shorter than ${schema.minLength}`);
  }
  if (Array.isArray(obj)) {
    if (schema.minItems && obj.length < schema.minItems) errs.push(`${path}: fewer than ${schema.minItems} items`);
    if (schema.uniqueItems && new Set(obj.map((v) => JSON.stringify(v))).size !== obj.length) errs.push(`${path}: duplicate items`);
    if (schema.items) obj.forEach((v, i) => errs.push(...validate(v, schema.items, root, `${path}[${i}]`)));
  }
  if (actual === "object") {
    for (const k of schema.required ?? []) if (!(k in obj)) errs.push(`${path}.${k}: missing`);
    for (const [k, v] of Object.entries(obj)) {
      const sub = schema.properties?.[k];
      if (sub) errs.push(...validate(v, sub, root, `${path}.${k}`));
      else if (schema.additionalProperties === false) errs.push(`${path}.${k}: not allowed`);
      else if (typeof schema.additionalProperties === "object") errs.push(...validate(v, schema.additionalProperties, root, `${path}.${k}`));
    }
  }
  return errs;
}

// ---------- canonical palettes ----------
export function paletteSchema() {
  const f = join(PALETTES_SRC, "palette.schema.json");
  if (!existsSync(f)) throw new Error(`palette schema not found at ${f} (set TAILOR_PALETTES)`);
  return readJson(f);
}
export function listSourcePalettes() {
  if (!existsSync(PALETTES_SRC)) return [];
  return readdirSync(PALETTES_SRC)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".schema.json"))
    .map((f) => f.slice(0, -5))
    .sort();
}
export function loadPalette(ref) {
  const file = existsSync(ref) && statSync(ref).isFile() ? ref : join(PALETTES_SRC, `${ref}.json`);
  if (!existsSync(file)) throw new Error(`palette not found: ${ref} (looked in ${PALETTES_SRC})`);
  const p = readJson(file);
  const errs = validate(p, paletteSchema());
  if (errs.length) throw new Error(`${basename(file)} is invalid:\n  ${errs.join("\n  ")}`);
  if (p.id !== basename(file, ".json")) throw new Error(`${basename(file)}: id "${p.id}" does not match the file name`);
  return p;
}

// ---------- palette → tokens ----------
// Mechanical 1:1 mapping, see core/tokens.css header. `c` is the palette (dark/base block) or its `light` block.
export function tokenPairs(c, mode) {
  const neutrals = c.neutrals ?? [];
  const darkest = neutrals.find((n) => (mode === "dark" ? luminance(n) < luminance(c.inset) : luminance(n) > luminance(c.surface)));
  const overlay = darkest ?? (mode === "dark" ? c.inset : c.surface);
  const pairs = [
    ["--t-canvas", c.canvas], ["--t-inset", c.inset], ["--t-surface", c.surface], ["--t-selection", c.selection],
    ["--t-border", c.border], ["--t-overlay-bg", overlay],
    ["--t-text", c.text], ["--t-muted", c.muted], ["--t-disabled", c.disabled],
    ["--t-accent", c.accent], ["--t-accent-solid", c.accent_solid ?? c.accent], ["--t-on-accent", c.on_accent], ["--t-link", c.link],
    ["--t-success", c.success], ["--t-warning", c.warning], ["--t-danger", c.danger], ["--t-info", c.info],
  ];
  for (const hue of ["red", "orange", "yellow", "green", "cyan", "purple", "pink", "blue", "teal", "magenta"]) {
    if (c.extra?.[hue]) pairs.push([`--t-hue-${hue}`, c.extra[hue]]);
  }
  if (mode === "light") {
    pairs.push(["--t-shadow-sm", "0 1px 2px rgb(0 0 0 / 0.08)"], ["--t-shadow-md", "0 4px 16px rgb(0 0 0 / 0.12)"], ["--t-shadow-lg", "0 16px 48px rgb(0 0 0 / 0.18)"]);
  }
  return pairs;
}
export function paletteCss(p) {
  const block = (sel, c, mode) =>
    `${sel} {\n  color-scheme: ${mode};\n` + tokenPairs(c, mode).map(([k, v]) => `  ${(k + ":").padEnd(18)}${v};`).join("\n") + "\n}\n";
  let out = `/* ${p.name} — tailor palette tokens, generated by bin/gen-palette from ${p.id}.json (${p.docs}).\n` +
    `   Do not edit: change the canonical palette and run bin/build. Licence of the colour values: ${p.license}.\n` +
    `   Load after core/tokens.css; activate with <html data-palette="${p.id}" data-mode="${p.mode}">. */\n\n`;
  out += block(`[data-palette="${p.id}"]`, p, p.mode);
  if (p.light) {
    out += `\n/* light counterpart */\n` + block(`[data-palette="${p.id}"][data-mode="light"]`, { ...p.light, neutrals: p.light.neutrals ?? [] }, "light");
  } else if (p.mode === "dark") {
    out += `\n/* ${p.id} has no light counterpart: data-mode="light" is not offered for it (see manifest.json compatibility). */\n`;
  }
  return out;
}
export const paletteModes = (p) => (p.light ? [p.mode, p.mode === "dark" ? "light" : "dark"] : [p.mode]);

// ---------- CSS sanity: balanced braces outside strings/comments, no NUL ----------
export function cssBraceCheck(text) {
  let depth = 0, inStr = null, inComment = false, line = 1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === "\n") line++;
    if (inComment) { if (ch === "*" && next === "/") { inComment = false; i++; } continue; }
    if (inStr) { if (ch === "\\") { i++; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === "/" && next === "*") { inComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { inStr = ch; continue; }
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth < 0) return `unexpected "}" at line ${line}`; }
  }
  if (inComment) return "unterminated comment";
  if (inStr) return "unterminated string";
  if (depth !== 0) return `${depth} unclosed "{"`;
  return null;
}

// ---------- misc ----------
export const listSkins = () =>
  existsSync(SKINS)
    ? readdirSync(SKINS).filter((d) => !d.startsWith("_") && !d.startsWith(".") && statSync(join(SKINS, d)).isDirectory() && existsSync(join(SKINS, d, "manifest.json"))).sort()
    : [];

export function hexOf(cssValue, fallbackMap = {}) {
  // Resolve a token value that may be a hex or var(--x) against a map of known token values.
  const v = cssValue.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  const m = v.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (m && fallbackMap[m[1]]) return hexOf(fallbackMap[m[1]], fallbackMap);
  return null;
}

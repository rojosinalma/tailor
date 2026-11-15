/**
 * Lints the skins: each folder core/skins/<id>/ has a valid skin.json and an extras.css that changes looks only.
 */
import { existsSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import postcss, { type Declaration } from "postcss";
import { EXTRAS_PROPERTIES, SKIN_SETTINGS, type SkinSpec, validateSkin } from "../../core/src/skins";
import {
  absoluteLengthFindings,
  atRuleLine,
  colorFindings,
  declLine,
  declText,
  type Finding,
  lexValue,
  lintAllow,
  type Problem,
  report,
  ruleLine,
  selectorParts,
} from "./lint-css";
import { at, ROOT } from "./paths";

/** The settings that may use black with an alpha, `rgb(0 0 0 / <alpha>)`. */
const SHADOW_SETTINGS: ReadonlySet<string> = new Set([
  "shadow-sm",
  "shadow-md",
  "shadow-lg",
  "card-shadow",
  "btn-shadow",
]);

/** Extras properties that draw a line, so they may give its thickness in an absolute length. */
const THICKNESS_PROPERTIES: readonly RegExp[] = [
  /^border(-[a-z-]+)?-width$/,
  /^border(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?$/,
  /^outline(-[a-z]+)?$/,
  /^box-shadow$/,
  /^text-decoration-thickness$/,
  /^text-underline-offset$/,
  /^letter-spacing$/,
  /^stroke-width$/,
];

const GLOBAL_KEYWORDS: ReadonlySet<string> = new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
]);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The line of the first `"key"` in the JSON text, or 1. */
const jsonLine = (text: string | undefined, key: string): number => {
  const i = text?.indexOf(JSON.stringify(key)) ?? -1;
  return text && i >= 0 ? (text.slice(0, i).match(/\n/g)?.length ?? 0) + 1 : 1;
};

/** Checks the shape of skin.json before validateSkin reads it. */
function shapeErrors(spec: unknown): string[] {
  if (!isRecord(spec)) return ["skin.json is not an object"];
  const errors: string[] = [];
  for (const key of ["id", "name", "about"]) {
    if (typeof spec[key] !== "string") errors.push(`"${key}" must be a string`);
  }
  const source = spec.source;
  if (!isRecord(source) || !["name", "url", "license"].every((k) => typeof source[k] === "string")) {
    errors.push('"source" must be { name, url, license } strings');
  }
  if (!isRecord(spec.settings) || !Object.values(spec.settings).every((v) => typeof v === "string")) {
    errors.push('"settings" must be an object of strings');
  }
  if (spec.fonts !== undefined) {
    const ok =
      Array.isArray(spec.fonts) &&
      spec.fonts.every(
        (f) =>
          isRecord(f) &&
          ["family", "file", "weight"].every((k) => typeof f[k] === "string") &&
          (f.style === "normal" || f.style === "italic"),
      );
    if (!ok) errors.push('"fonts" must be a list of { family, file, weight, style: "normal" | "italic" }');
  }
  return errors;
}

/**
 * Lints one skin.json. `folder` is the skin folder (its name must equal the id; fonts live in its fonts/).
 * `text`, the raw JSON, only places the problems on their lines.
 */
export function lintSkinSpec(file: string, spec: unknown, folder: string, text?: string): Problem[] {
  const problems: Problem[] = [];
  const add = (line: number, rule: string, message: string): void => {
    problems.push({ file, line, rule, message });
  };
  const shape = shapeErrors(spec);
  if (shape.length || !isRecord(spec)) {
    for (const e of shape) add(1, "skin-spec", e);
    return problems;
  }
  const skin = spec as unknown as SkinSpec;
  for (const e of validateSkin(skin)) add(1, "skin-spec", e);
  const dir = basename(folder);
  if (skin.id !== dir)
    add(jsonLine(text, "id"), "skin-spec", `id "${skin.id}" differs from the folder name "${dir}"`);
  for (const font of skin.fonts ?? []) {
    const line = jsonLine(text, font.file);
    if (font.file !== basename(font.file) || font.file.startsWith(".")) {
      add(line, "skin-spec", `font file "${font.file}" must be a plain file name in fonts/`);
    } else if (!existsSync(join(folder, "fonts", font.file))) {
      add(line, "skin-spec", `font file "${font.file}" is missing from fonts/`);
    }
  }
  for (const [key, value] of Object.entries(skin.settings)) {
    if (!(key in SKIN_SETTINGS) || typeof value !== "string") continue;
    for (const f of colorFindings(value, { blackAlpha: SHADOW_SETTINGS.has(key) })) {
      add(jsonLine(text, key), "setting-color", `setting "${key}": ${f.message}`);
    }
  }
  return problems;
}

/** A corner radius in extras: only var(--t-…), 0, a percentage or a global keyword. */
function radiusFindings(value: string): Finding[] {
  const out: Finding[] = [];
  for (const t of lexValue(value)) {
    if (t.depth > 0 || t.kind === "close" || (t.kind === "delim" && t.text === "/")) continue;
    if (t.kind === "func" && t.text === "var") continue;
    if (t.kind === "num" && (t.value === 0 || t.unit === "%")) continue;
    if (t.kind === "ident" && GLOBAL_KEYWORDS.has(t.text.toLowerCase())) continue;
    out.push({
      index: t.index,
      message: `corner radius "${t.kind === "num" ? t.text + t.unit : t.text}": radius comes from the skin settings`,
    });
  }
  return out;
}

/** Hover, reduced motion, and the phone width: a skin can give the phone form of a component another look. */
const ALLOWED_MEDIA = [
  /^\(\s*hover\s*:\s*hover\s*\)$/i,
  /^\(\s*prefers-reduced-motion\s*:\s*[a-z-]+\s*\)$/i,
  /^\(\s*max-width\s*:\s*40rem\s*\)$/i,
];

export function lintSkinExtras(file: string, css: string): Problem[] {
  const root = postcss.parse(css, { from: file });
  const { problems, allowed } = lintAllow(file, root);
  const add = (line: number, rule: string, message: string): void => {
    problems.push({ file, line, rule, message });
  };

  root.walkDecls((d: Declaration) => {
    if (allowed(d)) return;
    const prop = d.prop.startsWith("--") ? d.prop : d.prop.toLowerCase();
    const line = d.source?.start?.line ?? 0;
    if (!EXTRAS_PROPERTIES.some((re) => re.test(prop))) {
      add(
        line,
        "extras-property",
        `"${d.prop}" is not a looks-only property: extras never change size, spacing or position`,
      );
    }
    const { text, valueAt } = declText(d);
    const value = text.slice(valueAt);
    for (const f of colorFindings(value)) add(declLine(d, f), "extras-color", f.message);
    if (/^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/.test(prop)) {
      for (const f of radiusFindings(value)) add(declLine(d, f), "extras-length", f.message);
    } else if (!THICKNESS_PROPERTIES.some((re) => re.test(prop))) {
      for (const f of absoluteLengthFindings(value)) add(declLine(d, f), "extras-length", f.message);
    }
    if (d.important) add(line, "important", `!important in "${d.prop}"`);
  });

  root.walkAtRules((a) => {
    const name = a.name.toLowerCase();
    const ok =
      name === "supports" || (name === "media" && ALLOWED_MEDIA.some((re) => re.test(a.params.trim())));
    if (!ok) {
      add(
        atRuleLine(a, 0),
        "extras-at-rule",
        `@${a.name} ${a.params}`.trim() +
          ": extras allow only @media (hover: hover), @media (prefers-reduced-motion: …) and @supports",
      );
    }
  });

  root.walkRules((r) => {
    for (const p of selectorParts(r.selector)) {
      if (p.kind === "id")
        add(ruleLine(r, p.index), "extras-selector", `id selector "#${p.name}": use a class`);
      else if (!p.name.startsWith("t-"))
        add(ruleLine(r, p.index), "extras-selector", `class ".${p.name}" must start with "t-"`);
    }
    for (const m of r.selector.matchAll(/\[\s*data-(skin|palette)\b/g)) {
      add(
        ruleLine(r, m.index),
        "extras-selector",
        `"[data-${m[1]}" in a selector: the build adds the skin scope, and a skin works with every palette`,
      );
    }
  });

  return problems.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

/** The skin folders under `dir`, sorted. */
export const skinFolders = (dir = at("core/skins")): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => join(dir, e.name))
        .sort()
    : [];

/** Lints every folder under core/skins/ (or under `dir`). */
export async function lintSkins(dir = at("core/skins")): Promise<Problem[]> {
  const problems: Problem[] = [];
  for (const folder of skinFolders(dir)) {
    const specFile = join(folder, "skin.json");
    const extrasFile = join(folder, "extras.css");
    const rel = (p: string): string => relative(ROOT, p);
    if (!existsSync(specFile)) {
      problems.push({ file: rel(specFile), line: 0, rule: "skin-spec", message: "skin.json is missing" });
    } else {
      const text = await Bun.file(specFile).text();
      let spec: unknown;
      try {
        spec = JSON.parse(text);
      } catch (e) {
        problems.push({
          file: rel(specFile),
          line: 1,
          rule: "skin-spec",
          message: `not valid JSON: ${String(e)}`,
        });
      }
      if (spec !== undefined) problems.push(...lintSkinSpec(rel(specFile), spec, folder, text));
    }
    if (!existsSync(extrasFile)) {
      problems.push({
        file: rel(extrasFile),
        line: 0,
        rule: "skin-spec",
        message: "extras.css is missing (it may be empty)",
      });
    } else {
      problems.push(...lintSkinExtras(rel(extrasFile), await Bun.file(extrasFile).text()));
    }
  }
  return problems;
}

if (import.meta.main) {
  const skins = skinFolders().length;
  const problems = await lintSkins();
  process.exit(report("lint-skins", problems, `${skins} skin${skins === 1 ? "" : "s"}`));
}

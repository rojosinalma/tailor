/**
 * Lints tailor's own CSS against the style rules: no colour literal, no absolute length, no raw duration,
 * only the two breakpoints, the class prefix, known tokens. A violation fails the build.
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { Glob } from "bun";
import postcss, { type AtRule, type ChildNode, type Declaration, type Root, type Rule } from "postcss";
import { at, ROOT } from "./paths";

export interface Problem {
  file: string;
  line: number;
  rule: string;
  message: string;
}

export type CssKind = "pack" | "base" | "showcase";

/** A finding inside one piece of text: the offset of the offending token and what is wrong. */
export interface Finding {
  index: number;
  message: string;
}

// ---------------------------------------------------------------------------------------------------------
// Value lexer

type TokKind = "ident" | "func" | "hash" | "num" | "str" | "url" | "open" | "close" | "comma" | "delim";

interface Tok {
  kind: TokKind;
  /** The text as written; for "num" the number part only. */
  text: string;
  /** Lower-case unit of a number, "" when unitless, "%" for a percentage. */
  unit: string;
  value: number;
  index: number;
  /** Nesting depth outside the token: a function and its closing bracket share one depth. */
  depth: number;
  /** True inside the fallback (second argument) of var() or env(). */
  fallback: boolean;
}

const IDENT_CHAR = /[\w\-\u0080-\uffff]/;
const NUMBER = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/y;

const isIdentStart = (s: string, i: number): boolean => {
  const c = s[i] ?? "";
  if (/[a-zA-Z_\u0080-\uffff\\]/.test(c)) return true;
  if (c === "-") {
    const n = s[i + 1] ?? "";
    return /[a-zA-Z_\-\u0080-\uffff\\]/.test(n);
  }
  return false;
};

const isNumberStart = (s: string, i: number): boolean => {
  const c = s[i] ?? "";
  const n = s[i + 1] ?? "";
  if (/\d/.test(c)) return true;
  if (c === "." && /\d/.test(n)) return true;
  if (c === "+" || c === "-") return /\d/.test(n) || (n === "." && /\d/.test(s[i + 2] ?? ""));
  return false;
};

function readIdent(s: string, i: number): number {
  let j = i;
  while (j < s.length) {
    const c = s[j] ?? "";
    if (c === "\\") j += 2;
    else if (IDENT_CHAR.test(c)) j++;
    else break;
  }
  return j;
}

function skipString(s: string, i: number): number {
  const q = s[i];
  let j = i + 1;
  while (j < s.length && s[j] !== q) j += s[j] === "\\" ? 2 : 1;
  return j + 1;
}

/** Splits a CSS value into tokens. Comments are dropped; strings and url() contents become one token. */
export function lexValue(s: string): Tok[] {
  const toks: Tok[] = [];
  const stack: { name: string; arg: number }[] = [];
  const inFallback = (): boolean => stack.some((f) => (f.name === "var" || f.name === "env") && f.arg >= 1);
  const push = (kind: TokKind, text: string, index: number, unit = "", value = 0): void => {
    toks.push({ kind, text, unit, value, index, depth: stack.length, fallback: inFallback() });
  };
  let i = 0;
  while (i < s.length) {
    const c = s[i] ?? "";
    if (/\s/.test(c)) {
      i++;
    } else if (c === "/" && s[i + 1] === "*") {
      const end = s.indexOf("*/", i + 2);
      i = end < 0 ? s.length : end + 2;
    } else if (c === '"' || c === "'") {
      const end = skipString(s, i);
      push("str", s.slice(i, end), i);
      i = end;
    } else if (c === "#") {
      const end = readIdent(s, i + 1);
      push(end > i + 1 ? "hash" : "delim", s.slice(i, Math.max(end, i + 1)), i);
      i = Math.max(end, i + 1);
    } else if (isNumberStart(s, i)) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(s);
      const num = m?.[0] ?? c;
      let j = i + num.length;
      let unit = "";
      if (s[j] === "%") {
        unit = "%";
        j++;
      } else if (isIdentStart(s, j) && s[j] !== "-") {
        const end = readIdent(s, j);
        unit = s.slice(j, end).toLowerCase();
        j = end;
      }
      push("num", num, i, unit, Number(num));
      i = j;
    } else if (isIdentStart(s, i)) {
      const end = readIdent(s, i);
      const name = s.slice(i, end);
      if (s[end] === "(") {
        const lower = name.toLowerCase();
        if (lower === "url") {
          // Unquoted or quoted, the contents of url() are never linted.
          let j = end + 1;
          while (j < s.length && s[j] !== ")") j = s[j] === '"' || s[j] === "'" ? skipString(s, j) : j + 1;
          push("url", s.slice(i, j + 1), i);
          i = j + 1;
        } else {
          push("func", lower, i);
          stack.push({ name: lower, arg: 0 });
          i = end + 1;
        }
      } else {
        push("ident", name, i);
        i = end;
      }
    } else if (c === "(") {
      push("open", c, i);
      stack.push({ name: "", arg: 0 });
      i++;
    } else if (c === ")") {
      stack.pop();
      push("close", c, i);
      i++;
    } else if (c === ",") {
      const top = stack[stack.length - 1];
      if (top) top.arg++;
      push("comma", c, i);
      i++;
    } else {
      push("delim", c, i);
      i++;
    }
  }
  return toks;
}

/** The index in `toks` of the bracket that closes the function or bracket at `open`. */
function closeOf(toks: readonly Tok[], open: number): number {
  const depth = toks[open]?.depth ?? 0;
  for (let k = open + 1; k < toks.length; k++) {
    const t = toks[k];
    if (t?.kind === "close" && t.depth === depth) return k;
  }
  return toks.length;
}

// ---------------------------------------------------------------------------------------------------------
// Shared value checks (also used by lint-skins)

export const NAMED_COLORS: ReadonlySet<string> = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown " +
    "burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
    "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid " +
    "darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro " +
    "ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow " +
    "lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine " +
    "mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise " +
    "mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab " +
    "orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru " +
    "pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna sil\u0076er skyblue slateblue slategray slategrey snow springgreen steelblue tan " +
    "teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);

const COLOR_FUNCTIONS: ReadonlySet<string> = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
]);

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Absolute length units. `rlh` counts too: it follows the root, not the component. */
export const ABSOLUTE_UNITS: ReadonlySet<string> = new Set([
  "px",
  "rem",
  "pt",
  "pc",
  "cm",
  "mm",
  "in",
  "q",
  "rlh",
]);

const TIME_UNITS: ReadonlySet<string> = new Set(["s", "ms"]);
const RESOLUTION_UNITS: ReadonlySet<string> = new Set(["dpi", "dpcm", "dppx", "x"]);
export const BREAKPOINTS: ReadonlySet<string> = new Set(["40rem", "64rem"]);

export interface ColorOptions {
  /** Allow black with an alpha, `rgb(0 0 0 / <alpha>)`: the shadow settings of a skin. */
  blackAlpha?: boolean;
}

const BLACK_ALPHA = /^\s*0\s*[\s,]\s*0\s*[\s,]\s*0\s*[/,]/;

/** Colour literals in a value. `var(--t-…)`, `transparent`, `currentColor` and `color-mix()` of those pass. */
export function colorFindings(value: string, opts: ColorOptions = {}): Finding[] {
  const out: Finding[] = [];
  const toks = lexValue(value);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (!t) continue;
    if (t.kind === "hash" && HEX_COLOR.test(t.text)) {
      out.push({ index: t.index, message: `colour literal "${t.text}": use a var(--t-…) token` });
    } else if (t.kind === "func" && COLOR_FUNCTIONS.has(t.text)) {
      const end = closeOf(toks, k);
      const closeTok = toks[end];
      const args = value.slice(t.index + t.text.length + 1, closeTok ? closeTok.index : value.length);
      if (opts.blackAlpha && (t.text === "rgb" || t.text === "rgba") && BLACK_ALPHA.test(args)) {
        k = end;
        continue;
      }
      out.push({ index: t.index, message: `colour function "${t.text}()": use a var(--t-…) token` });
      k = end;
    } else if (t.kind === "ident" && NAMED_COLORS.has(t.text.toLowerCase())) {
      out.push({ index: t.index, message: `named colour "${t.text}": use a var(--t-…) token` });
    }
  }
  return out;
}

/** Absolute lengths in a value. A zero length is allowed only as the fallback of var() or env(). */
export function absoluteLengthFindings(value: string): Finding[] {
  return lexValue(value)
    .filter((t) => t.kind === "num" && ABSOLUTE_UNITS.has(t.unit) && !(t.fallback && t.value === 0))
    .map((t) => ({
      index: t.index,
      message: `absolute length "${t.text}${t.unit}": use a token, em, %, or a viewport unit`,
    }));
}

/** Raw durations in a value; zero is allowed. */
export function durationFindings(value: string): Finding[] {
  return lexValue(value)
    .filter((t) => t.kind === "num" && TIME_UNITS.has(t.unit) && t.value !== 0)
    .map((t) => ({
      index: t.index,
      message: `raw duration "${t.text}${t.unit}": use var(--t-motion-fast) or var(--t-motion-base)`,
    }));
}

/** Lengths in a @media or @container prelude other than the two breakpoints. */
export function breakpointFindings(params: string): Finding[] {
  return lexValue(params)
    .filter((t) => t.kind === "num" && t.unit !== "" && t.unit !== "%" && !RESOLUTION_UNITS.has(t.unit))
    .filter((t) => !BREAKPOINTS.has(`${t.text}${t.unit}`))
    .map((t) => ({
      index: t.index,
      message: `breakpoint "${t.text}${t.unit}": the only breakpoints are ${[...BREAKPOINTS].join(" and ")}`,
    }));
}

/** The `--t-…` names that a value reads through var(). */
export function tokenReads(value: string): { index: number; name: string }[] {
  const toks = lexValue(value);
  const out: { index: number; name: string }[] = [];
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    const n = toks[k + 1];
    if (t?.kind === "func" && t.text === "var" && n?.kind === "ident" && n.text.startsWith("--t-")) {
      out.push({ index: n.index, name: n.text });
    }
  }
  return out;
}

/** Class and id selectors in a selector, with attribute values and strings blanked out. */
export function selectorParts(selector: string): { index: number; kind: "class" | "id"; name: string }[] {
  let s = "";
  for (let i = 0; i < selector.length; ) {
    const c = selector[i] ?? "";
    if (c === "\\") {
      s += "  ";
      i += 2;
    } else if (c === '"' || c === "'") {
      const end = Math.min(skipString(selector, i), selector.length);
      s += " ".repeat(end - i);
      i = end;
    } else if (c === "[") {
      let j = i + 1;
      while (j < selector.length && selector[j] !== "]") {
        j = selector[j] === '"' || selector[j] === "'" ? skipString(selector, j) : j + 1;
      }
      j = Math.min(j + 1, selector.length);
      s += " ".repeat(j - i);
      i = j;
    } else {
      s += c;
      i++;
    }
  }
  const out: { index: number; kind: "class" | "id"; name: string }[] = [];
  for (const m of s.matchAll(/([.#])(-?[a-zA-Z_\u0080-\uffff][\w\-\u0080-\uffff]*)/g)) {
    out.push({ index: m.index, kind: m[1] === "." ? "class" : "id", name: m[2] ?? "" });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Positions and the escape hatch

const lineAt = (start: number, text: string, index: number): number =>
  start + (text.slice(0, index).match(/\n/g)?.length ?? 0);

/** The text of a declaration as the finders see it, and where its value starts. */
export function declText(decl: Declaration): { text: string; valueAt: number } {
  const raw = (decl.raws as { value?: { raw?: string } }).value?.raw ?? decl.value;
  const between = decl.raws.between ?? ":";
  return { text: `${decl.prop}${between}${raw}`, valueAt: decl.prop.length + between.length };
}

export const declLine = (decl: Declaration, f: Finding): number => {
  const { text, valueAt } = declText(decl);
  return lineAt(decl.source?.start?.line ?? 0, text, valueAt + f.index);
};

export const ruleLine = (rule: Rule, index: number): number => {
  const raw = (rule.raws as { selector?: { raw?: string } }).selector?.raw ?? rule.selector;
  return lineAt(rule.source?.start?.line ?? 0, raw, index);
};

export const atRuleLine = (node: AtRule, index: number): number =>
  lineAt(
    node.source?.start?.line ?? 0,
    `@${node.name}${node.raws.afterName ?? " "}${node.params}`,
    node.name.length + 1 + (node.raws.afterName ?? " ").length + index,
  );

const LINT_ALLOW = /^lint-allow\b:?\s*([\s\S]*)$/;

/** Problems for an empty `lint-allow` reason, and whether a declaration is allowed by the comment before it. */
export function lintAllow(
  file: string,
  root: Root,
): { problems: Problem[]; allowed: (d: Declaration) => boolean } {
  const problems: Problem[] = [];
  root.walkComments((c) => {
    const m = LINT_ALLOW.exec(c.text.trim());
    if (m && !m[1]?.trim()) {
      problems.push({
        file,
        line: c.source?.start?.line ?? 0,
        rule: "lint-allow",
        message: "lint-allow needs a reason: /* lint-allow: <reason> */",
      });
    }
  });
  const allowed = (d: Declaration): boolean => {
    const prev: ChildNode | undefined = d.prev();
    if (prev?.type !== "comment") return false;
    const m = LINT_ALLOW.exec(prev.text.trim());
    return Boolean(m?.[1]?.trim());
  };
  return { problems, allowed };
}

const inKeyframes = (rule: Rule): boolean =>
  rule.parent?.type === "atrule" && /keyframes$/i.test((rule.parent as AtRule).name);

// ---------------------------------------------------------------------------------------------------------
// The CSS lint

let tokenNames: ReadonlySet<string> | undefined;

/** The custom properties that core/css/tokens.css defines, parsed once. */
export function definedTokens(): ReadonlySet<string> {
  if (!tokenNames) {
    const names = new Set<string>();
    postcss.parse(readFileSync(at("core/css/tokens.css"), "utf8")).walkDecls((d) => {
      if (d.prop.startsWith("--")) names.add(d.prop);
    });
    tokenNames = names;
  }
  return tokenNames;
}

export function lintCssText(file: string, css: string, kind: CssKind): Problem[] {
  const root = postcss.parse(css, { from: file });
  const { problems, allowed } = lintAllow(file, root);
  const add = (line: number, rule: string, message: string): void => {
    problems.push({ file, line, rule, message });
  };
  const tokens = definedTokens();
  const local = new Set<string>();
  root.walkDecls((d) => {
    if (d.prop.startsWith("--t-")) local.add(d.prop);
  });

  root.walkDecls((d) => {
    if (allowed(d)) return;
    const { text, valueAt } = declText(d);
    const value = text.slice(valueAt);
    for (const f of colorFindings(value)) add(declLine(d, f), "color-literal", f.message);
    for (const f of absoluteLengthFindings(value)) add(declLine(d, f), "absolute-length", f.message);
    for (const f of durationFindings(value)) add(declLine(d, f), "raw-duration", f.message);
    for (const r of tokenReads(value)) {
      if (!tokens.has(r.name) && !local.has(r.name)) {
        add(declLine(d, { index: r.index, message: "" }), "unknown-token", `unknown token "${r.name}"`);
      }
    }
    if (d.important && kind === "pack") {
      add(d.source?.start?.line ?? 0, "important", `!important in "${d.prop}": a pack never needs it`);
    }
  });

  root.walkAtRules((a) => {
    const name = a.name.toLowerCase();
    if (name === "media" || name === "container") {
      for (const f of breakpointFindings(a.params)) add(atRuleLine(a, f.index), "breakpoint", f.message);
    }
    if (name === "layer" && kind === "pack") {
      add(
        a.source?.start?.line ?? 0,
        "layer",
        "@layer in a pack file: the build wraps each pack in its layer",
      );
    }
  });

  root.walkRules((r) => {
    if (inKeyframes(r)) return;
    for (const p of selectorParts(r.selector)) {
      if (p.kind === "id") {
        if (kind !== "showcase")
          add(ruleLine(r, p.index), "id-selector", `id selector "#${p.name}": use a class`);
      } else if (kind === "showcase" ? !/^(sc|t)-/.test(p.name) : !p.name.startsWith("t-")) {
        add(
          ruleLine(r, p.index),
          "class-prefix",
          `class ".${p.name}" must start with ${kind === "showcase" ? '"sc-" or "t-"' : '"t-"'}`,
        );
      }
    }
  });

  return problems.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

const scan = async (pattern: string): Promise<string[]> =>
  (await Array.fromAsync(new Glob(pattern).scan(ROOT))).sort();

const BASE_FILES = ["core/css/base.css", "core/css/control.css", "core/css/popup.css"];

const kindOf = (file: string): CssKind =>
  file.startsWith("core/packs/") ? "pack" : file.startsWith("showcase/") ? "showcase" : "base";

/** The default file set. tokens.css and layers.css are exempt: they define the values. */
export const cssFiles = async (): Promise<string[]> => [
  ...(await scan("core/packs/**/*.css")),
  ...BASE_FILES,
  ...(await scan("showcase/src/**/*.css")),
];

/** Lints the given files (paths relative to the repo root), or the default set. */
export async function lintCss(files?: string[]): Promise<Problem[]> {
  const list = files ?? (await cssFiles());
  const problems: Problem[] = [];
  for (const f of list) {
    const rel = relative(ROOT, at(f));
    problems.push(...lintCssText(rel, await Bun.file(at(f)).text(), kindOf(rel)));
  }
  return problems;
}

/** Prints the problems and the summary line; returns the exit code. */
export function report(name: string, problems: readonly Problem[], checked: string): number {
  for (const p of problems) console.error(`${p.file}:${p.line}: [${p.rule}] ${p.message}`);
  console.log(`${name}: ${checked}, ${problems.length} problem${problems.length === 1 ? "" : "s"}`);
  return problems.length ? 1 : 0;
}

if (import.meta.main) {
  const files = await cssFiles();
  process.exit(report("lint-css", await lintCss(files), `${files.length} files`));
}

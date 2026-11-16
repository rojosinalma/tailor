/** The log view logic that both kits share: levels, ANSI colour codes and the marks of a filter. */

export const LEVELS = ["error", "warn", "info", "debug"] as const;
export type Level = (typeof LEVELS)[number];

/** The tone of a level: error is danger, warn is warning, debug is muted, info has none. */
export const LEVEL_TONE: Readonly<Record<Level, "danger" | "warning" | "neutral" | undefined>> = {
  error: "danger",
  warn: "warning",
  info: undefined,
  debug: "neutral",
};

const WORDS: Readonly<Record<string, Level>> = {
  error: "error",
  err: "error",
  fatal: "error",
  crit: "error",
  critical: "error",
  warn: "warn",
  warning: "warn",
  info: "info",
  notice: "info",
  debug: "debug",
  trace: "debug",
};

/** A level from a word such as "ERROR", "warning" or "trace"; undefined for anything else. */
export const levelOf = (word: string): Level | undefined => WORDS[word.trim().toLowerCase()];

/** The level that a line names itself, as a whole word near its start: "… ERROR …", "[warn]", "level=debug". */
export function detectLevel(text: string): Level | undefined {
  const match = /\b(error|err|fatal|crit|critical|warn|warning|info|notice|debug|trace)\b/i.exec(
    stripAnsi(text).slice(0, 80),
  );
  return match?.[1] ? levelOf(match[1]) : undefined;
}

/** A palette hue for text, or the muted text colour. */
export type Hue = "red" | "green" | "yellow" | "blue" | "purple" | "pink" | "cyan" | "muted";

export interface Segment {
  readonly text: string;
  readonly fg?: Hue;
  readonly bold?: boolean;
  readonly dim?: boolean;
  /** Part of a match of the filter. */
  readonly mark?: boolean;
}

// Black is muted text and white the normal text, so both stay readable in every palette.
const BASIC: readonly (Hue | undefined)[] = [
  "muted",
  "red",
  "green",
  "yellow",
  "blue",
  "purple",
  "cyan",
  undefined,
];
const BRIGHT: readonly (Hue | undefined)[] = [
  "muted",
  "red",
  "green",
  "yellow",
  "blue",
  "pink",
  "cyan",
  undefined,
];

// CSI sequences (colours and cursor moves), OSC sequences (titles, links) and single-character escapes.
// biome-ignore lint/suspicious/noControlCharactersInRegex: the escape character is what this matches.
const ESCAPE = /\x1b\[([0-9;?]*)([ -/]*[@-~])|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]/g;

interface Style {
  fg?: Hue;
  bold?: boolean;
  dim?: boolean;
}

function applySgr(style: Style, params: string): Style {
  const codes = params === "" ? [0] : params.split(";").map((p) => Number(p || 0));
  let next: Style = { ...style };
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i] ?? 0;
    if (code === 0) next = {};
    else if (code === 1) next.bold = true;
    else if (code === 2) next.dim = true;
    else if (code === 22) next = { fg: next.fg };
    else if (code === 39) next.fg = undefined;
    else if (code >= 30 && code <= 37) next.fg = BASIC[code - 30];
    else if (code >= 90 && code <= 97) next.fg = BRIGHT[code - 90];
    // 256 colours and true colour: the palette has no such hues, so the codes and their values go.
    else if (code === 38 || code === 48) i += codes[i + 1] === 5 ? 2 : codes[i + 1] === 2 ? 4 : 1;
  }
  return next;
}

const clean = (style: Style): Style =>
  Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined && v !== false));

/** Splits a line into styled runs: the 8 colours and their bright forms, bold and dim. Other codes go. */
export function parseAnsi(text: string): Segment[] {
  const out: Segment[] = [];
  let style: Style = {};
  let last = 0;
  const push = (part: string): void => {
    if (!part) return;
    const prev = out.at(-1);
    // A code that changes nothing keeps one run.
    if (prev && prev.fg === style.fg && prev.bold === style.bold && prev.dim === style.dim)
      out[out.length - 1] = { ...prev, text: prev.text + part };
    else out.push({ text: part, ...clean(style) });
  };
  for (const match of text.matchAll(ESCAPE)) {
    push(text.slice(last, match.index));
    last = match.index + match[0].length;
    if (match[2] === "m") style = applySgr(style, match[1] ?? "");
  }
  push(text.slice(last));
  return out;
}

export const stripAnsi = (text: string): string => text.replace(ESCAPE, "");

/** True when the line holds the query, in any case. An empty query matches every line. */
export const matchesQuery = (plain: string, query: string): boolean =>
  query === "" || plain.toLocaleLowerCase().includes(query.toLocaleLowerCase());

/** Splits the runs where the query matches, and marks the matching parts. */
export function markMatches(segments: readonly Segment[], query: string): Segment[] {
  if (query === "") return [...segments];
  const plain = segments.map((s) => s.text).join("");
  const lower = plain.toLocaleLowerCase();
  const needle = query.toLocaleLowerCase();
  const ranges: [number, number][] = [];
  for (let at = lower.indexOf(needle); at >= 0; at = lower.indexOf(needle, at + needle.length))
    ranges.push([at, at + needle.length]);
  if (ranges.length === 0) return [...segments];
  const out: Segment[] = [];
  let offset = 0;
  for (const segment of segments) {
    const end = offset + segment.text.length;
    let cut = offset;
    for (const [from, to] of ranges) {
      if (to <= cut || from >= end) continue;
      if (from > cut) out.push({ ...segment, text: plain.slice(cut, from) });
      const stop = Math.min(to, end);
      out.push({ ...segment, text: plain.slice(Math.max(from, cut), stop), mark: true });
      cut = stop;
    }
    if (cut < end) out.push({ ...segment, text: plain.slice(cut, end) });
    offset = end;
  }
  return out;
}

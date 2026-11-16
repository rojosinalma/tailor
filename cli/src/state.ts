/** tailor.json: the project's own record of what tailor put in it. The command is its only writer. */
import { basename, join, resolve } from "node:path";
import { Problem } from "./errors";
import { isSafePath, KITS, type Kit, Shape } from "./manifest";

export const STATE_FILE = "tailor.json";
export const DEFAULT_SOURCE = "github:rojosinalma/tailor";
export const DEFAULT_BASE = "/tailor/css/";
export const MODES = ["auto", "dark", "light"] as const;
export type ThemeMode = (typeof MODES)[number];

/** An address for the stylesheet links: no quotes, brackets or spaces, and a trailing slash. */
export const isBase = (base: string): boolean => /^[^"'<>\s]+\/$/.test(base);

export const DEFAULT_SCAN = ["**/*.{html,erb,tsx,ts,jsx,js,vue,svelte,astro,php,py,rb,templ,j2}"];

export interface State {
  readonly tailor: string;
  readonly source: string;
  readonly kit: Kit;
  readonly shell?: string;
  readonly packs: readonly string[];
  readonly public: string;
  readonly vendor: string;
  readonly theme: {
    readonly key: string;
    readonly skin: string;
    readonly palette: string;
    readonly mode: ThemeMode;
    /** The address of tailor/css/ on the site. */
    readonly base: string;
  };
  readonly icons: { readonly scan: readonly string[]; readonly add: readonly string[] };
  /** Every file tailor wrote, with the sha256 it had then. */
  readonly files: Readonly<Record<string, string>>;
}

/** The folder name in kebab-case: the default prefix of the stored theme choice. */
export function defaultKey(dir: string): string {
  const key = basename(resolve(dir))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return key || "app";
}

export function parseState(value: unknown, where = STATE_FILE): State {
  const s = new Shape(where);
  const o = s.object(value, "tailor.json");
  const folder = (v: unknown, field: string): string => {
    const path = s.string(v, field);
    if (!isSafePath(path)) s.fail(field, "a folder inside the project, such as public");
    return path;
  };
  const theme = s.object(o.theme, "theme");
  const icons = s.object(o.icons, "icons");
  const files = s.record(o.files, "files");
  for (const [path, hash] of Object.entries(files)) {
    if (!isSafePath(path)) s.fail(`files.${path}`, "a path inside the project");
    if (!/^[0-9a-f]{64}$/.test(hash)) s.fail(`files.${path}`, "a sha256 in hex");
  }
  const shell = s.optionalString(o.shell, "shell");
  const base = theme.base === undefined ? DEFAULT_BASE : s.string(theme.base, "theme.base");
  if (!isBase(base)) s.fail("theme.base", "an address that ends with a slash");
  return {
    tailor: s.version(o.tailor, "tailor"),
    source: s.string(o.source, "source"),
    kit: s.oneOf(o.kit, "kit", KITS),
    ...(shell ? { shell } : {}),
    packs: s.strings(o.packs, "packs"),
    public: folder(o.public, "public"),
    vendor: folder(o.vendor, "vendor"),
    theme: {
      key: s.string(theme.key, "theme.key"),
      skin: s.string(theme.skin, "theme.skin"),
      palette: s.string(theme.palette, "theme.palette"),
      mode: s.oneOf(theme.mode, "theme.mode", MODES),
      base,
    },
    icons: { scan: s.strings(icons.scan, "icons.scan"), add: s.strings(icons.add, "icons.add") },
    files,
  };
}

/** The file as written: stable key order, files sorted, so a diff of it is readable. */
export function formatState(state: State): string {
  const files = Object.fromEntries(
    Object.entries(state.files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  return `${JSON.stringify(
    {
      tailor: state.tailor,
      source: state.source,
      kit: state.kit,
      ...(state.shell ? { shell: state.shell } : {}),
      packs: state.packs,
      public: state.public,
      vendor: state.vendor,
      theme: state.theme,
      icons: state.icons,
      files,
    },
    null,
    2,
  )}\n`;
}

/** The state of the project in `dir`, or undefined when tailor is not in it yet. */
export async function readState(dir: string): Promise<State | undefined> {
  const file = Bun.file(join(dir, STATE_FILE));
  if (!(await file.exists())) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(await file.text());
  } catch (error) {
    throw new Problem(
      `${STATE_FILE} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      "Fix the file; the command is its only writer, so restore it from version control.",
    );
  }
  return parseState(value);
}

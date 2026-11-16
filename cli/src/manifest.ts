/** The release's manifest.json: what the release holds. Checked once when read, trusted after. */
import type { PackSpec } from "../../core/src/packs";
import type { ComponentSpec } from "../../core/src/spec";
import { Problem } from "./errors";
import { isVersion } from "./version";

export type Kit = "react" | "html";
export const KITS: readonly Kit[] = ["react", "html"];

export interface ManifestFile {
  /** Path inside the release folder. */
  readonly path: string;
  readonly sha256: string;
  /** "core", a pack id, "skins", "palettes", "icons" or "meta". */
  readonly pack: string;
  readonly kit?: Kit | "both";
}

export interface Breaking {
  readonly version: string;
  readonly title: string;
  readonly steps: readonly string[];
  readonly codemod?: string;
}

export interface ChangelogEntry {
  readonly version: string;
  readonly lines: readonly string[];
}

export interface Manifest {
  readonly version: string;
  readonly packs: readonly PackSpec[];
  readonly components: readonly ComponentSpec[];
  readonly skins: readonly { readonly id: string; readonly name: string; readonly about?: string }[];
  readonly palettes: readonly { readonly id: string; readonly name: string }[];
  /** The skin and palette a first visit gets unless the project picks others. */
  readonly theme: { readonly skin: string; readonly palette: string };
  readonly files: readonly ManifestFile[];
  readonly breaking: readonly Breaking[];
  readonly changelog?: readonly ChangelogEntry[];
}

type Json = unknown;

/** Small checks that name the field that is wrong. */
export class Shape {
  constructor(readonly where: string) {}
  fail(field: string, wanted: string): never {
    throw new Problem(
      `${this.where}: "${field}" must be ${wanted}.`,
      "Fix the file, or take it again from a release.",
    );
  }
  object(value: Json, field: string): Record<string, Json> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) this.fail(field, "an object");
    return value as Record<string, Json>;
  }
  string(value: Json, field: string): string {
    if (typeof value !== "string" || value === "") this.fail(field, "a non-empty string");
    return value;
  }
  optionalString(value: Json, field: string): string | undefined {
    return value === undefined ? undefined : this.string(value, field);
  }
  array(value: Json, field: string): Json[] {
    if (!Array.isArray(value)) this.fail(field, "a list");
    return value;
  }
  strings(value: Json, field: string): string[] {
    return this.array(value, field).map((v, i) => this.string(v, `${field}[${i}]`));
  }
  record(value: Json, field: string): Record<string, string> {
    const o = this.object(value, field);
    for (const [k, v] of Object.entries(o)) this.string(v, `${field}.${k}`);
    return o as Record<string, string>;
  }
  oneOf<const T extends string>(value: Json, field: string, allowed: readonly T[]): T {
    if (typeof value !== "string" || !(allowed as readonly string[]).includes(value))
      this.fail(field, `one of ${allowed.join(", ")}`);
    return value as T;
  }
  version(value: Json, field: string): string {
    const v = this.string(value, field);
    if (!isVersion(v)) this.fail(field, "a version such as 2.0.0");
    return v;
  }
}

const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[\w.@+-]+(?:\/[\w.@+-]+)*$/;

/** A relative path with no "." or ".." parts. */
export const isSafePath = (path: string): boolean => SAFE_PATH.test(path);

export function parseManifest(value: Json, where = "manifest.json"): Manifest {
  const s = new Shape(where);
  const m = s.object(value, "manifest");
  const packs = s.array(m.packs, "packs").map((p, i): PackSpec => {
    const o = s.object(p, `packs[${i}]`);
    const html = o.html;
    const htmlOk =
      html === "full" ||
      html === "none" ||
      (typeof html === "object" &&
        html !== null &&
        typeof (html as { partial?: unknown }).partial === "string");
    if (!htmlOk) s.fail(`packs[${i}].html`, 'one of "full", "none", { partial }');
    return {
      id: s.string(o.id, `packs[${i}].id`),
      name: s.string(o.name, `packs[${i}].name`),
      description: s.string(o.description, `packs[${i}].description`),
      requires: s.strings(o.requires, `packs[${i}].requires`),
      libraries: s.record(o.libraries, `packs[${i}].libraries`),
      ...(o.devLibraries === undefined
        ? {}
        : { devLibraries: s.record(o.devLibraries, `packs[${i}].devLibraries`) }),
      html: html as PackSpec["html"],
      ...(o.shell === true ? { shell: true } : {}),
    };
  });
  const ids = new Set(packs.map((p) => p.id));
  if (!ids.has("core")) s.fail("packs", "a list that holds the pack core");
  for (const p of packs)
    for (const r of p.requires) if (!ids.has(r)) s.fail(`packs.${p.id}.requires`, "known packs");
  const components = s.array(m.components, "components").map((c, i) => {
    const o = s.object(c, `components[${i}]`);
    s.string(o.id, `components[${i}].id`);
    s.string(o.name, `components[${i}].name`);
    if (!ids.has(s.string(o.pack, `components[${i}].pack`))) s.fail(`components[${i}].pack`, "a known pack");
    s.oneOf(o.html, `components[${i}].html`, ["markup", "script", "none"]);
    return o as unknown as ComponentSpec;
  });
  const named = (list: Json, field: string) =>
    s.array(list, field).map((x, i) => {
      const o = s.object(x, `${field}[${i}]`);
      return { id: s.string(o.id, `${field}[${i}].id`), name: s.string(o.name, `${field}[${i}].name`) };
    });
  const skins = named(m.skins, "skins");
  const palettes = named(m.palettes, "palettes");
  const theme = s.object(m.theme, "theme");
  const files = s.array(m.files, "files").map((f, i): ManifestFile => {
    const o = s.object(f, `files[${i}]`);
    const path = s.string(o.path, `files[${i}].path`);
    if (!isSafePath(path)) s.fail(`files[${i}].path`, "a relative path inside the release");
    const sha256 = s.string(o.sha256, `files[${i}].sha256`);
    if (!/^[0-9a-f]{64}$/.test(sha256)) s.fail(`files[${i}].sha256`, "a sha256 in hex");
    const pack = s.string(o.pack, `files[${i}].pack`);
    const kit =
      o.kit === undefined ? undefined : s.oneOf(o.kit, `files[${i}].kit`, ["react", "html", "both"]);
    return { path, sha256, pack, ...(kit ? { kit } : {}) };
  });
  const breaking = s.array(m.breaking, "breaking").map((b, i): Breaking => {
    const o = s.object(b, `breaking[${i}]`);
    const codemod = s.optionalString(o.codemod, `breaking[${i}].codemod`);
    return {
      version: s.version(o.version, `breaking[${i}].version`),
      title: s.string(o.title, `breaking[${i}].title`),
      steps: s.strings(o.steps, `breaking[${i}].steps`),
      ...(codemod ? { codemod } : {}),
    };
  });
  const changelog =
    m.changelog === undefined
      ? undefined
      : s.array(m.changelog, "changelog").map((c, i): ChangelogEntry => {
          const o = s.object(c, `changelog[${i}]`);
          return {
            version: s.version(o.version, `changelog[${i}].version`),
            lines: s.strings(o.lines, `changelog[${i}].lines`),
          };
        });
  return {
    version: s.version(m.version, "version"),
    packs,
    components,
    skins,
    palettes,
    theme: { skin: s.string(theme.skin, "theme.skin"), palette: s.string(theme.palette, "theme.palette") },
    files,
    breaking,
    ...(changelog ? { changelog } : {}),
  };
}

/** The packs named and every pack they require, each once, requirements first. */
export function withRequirements(packs: readonly PackSpec[], ids: readonly string[]): string[] {
  const out: string[] = [];
  const visit = (id: string, trail: readonly string[]): void => {
    const p = packs.find((x) => x.id === id);
    if (!p)
      throw new Problem(
        `This release has no pack "${id}".`,
        'Run "tailor list" to see the packs of the release.',
      );
    if (trail.includes(id))
      throw new Problem(`The packs require each other in a circle: ${[...trail, id].join(" → ")}`);
    for (const r of p.requires) visit(r, [...trail, id]);
    if (!out.includes(id)) out.push(id);
  };
  for (const id of ids) visit(id, []);
  return out;
}

/** The shells of a release: the shell packs, named without their "shell-" prefix. */
export const shellNames = (manifest: Manifest): string[] =>
  manifest.packs.filter((p) => p.shell).map((p) => p.id.replace(/^shell-/, ""));

export const shellPack = (name: string): string => `shell-${name}`;

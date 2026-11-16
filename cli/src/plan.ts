/**
 * The file plan: what to write, keep and remove so that the project holds the wanted files.
 * A file the project edited (its hash differs from the recorded one) is never overwritten or removed.
 */
import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, realpath, rm, rmdir } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { Problem } from "./errors";

export const sha256 = (data: string | Uint8Array): string => createHash("sha256").update(data).digest("hex");

/** A file the project should hold: copied from the release, or made by the command. */
export interface Wanted {
  readonly sha256: string;
  readonly data: () => Promise<Uint8Array | string>;
}

export type Step =
  | { readonly kind: "same"; readonly path: string; readonly record: string }
  | { readonly kind: "add" | "change"; readonly path: string; readonly record: string }
  | { readonly kind: "remove"; readonly path: string }
  /** Edited by the project: left as it is. `writeNew`: the new version goes next to it as <path>.new. */
  | { readonly kind: "kept"; readonly path: string; readonly writeNew: boolean; readonly record?: string }
  /** Recorded, gone from the disk and no longer wanted: only the record goes. */
  | { readonly kind: "forget"; readonly path: string };

/**
 * Pure: compares the wanted files, the recorded hashes and the hashes on disk (undefined = no file).
 */
export function planFiles(
  wanted: ReadonlyMap<string, string>,
  recorded: Readonly<Record<string, string>>,
  disk: ReadonlyMap<string, string | undefined>,
): Step[] {
  const steps: Step[] = [];
  const paths = [...new Set([...wanted.keys(), ...Object.keys(recorded)])].sort();
  for (const path of paths) {
    const want = wanted.get(path);
    const was = recorded[path];
    const now = disk.get(path);
    if (want !== undefined) {
      if (now === undefined) steps.push({ kind: "add", path, record: want });
      else if (now === want) steps.push({ kind: "same", path, record: want });
      else if (was === undefined || now !== was)
        steps.push({ kind: "kept", path, writeNew: want !== was, record: was ?? want });
      else steps.push({ kind: "change", path, record: want });
    } else if (now === undefined) steps.push({ kind: "forget", path });
    else if (was !== undefined && now !== was) steps.push({ kind: "kept", path, writeNew: false });
    else steps.push({ kind: "remove", path });
  }
  return steps;
}

/** The record after the plan: the wanted hashes, edited files with their old hash. */
export function recordAfter(steps: readonly Step[]): Record<string, string> {
  const files: Record<string, string> = {};
  for (const step of steps) if ("record" in step && step.record) files[step.path] = step.record;
  return files;
}

export interface Summary {
  readonly added: string[];
  readonly changed: string[];
  readonly removed: string[];
  readonly unchanged: number;
  /** Edited files that stay as they are; `newFiles` lists those that get a <name>.new. */
  readonly kept: string[];
  readonly newFiles: string[];
}

export function summarize(steps: readonly Step[]): Summary {
  const pick = (kind: Step["kind"]) => steps.filter((s) => s.kind === kind).map((s) => s.path);
  return {
    added: pick("add"),
    changed: pick("change"),
    removed: pick("remove"),
    unchanged: pick("same").length,
    kept: pick("kept"),
    newFiles: steps.filter((s) => s.kind === "kept" && s.writeNew).map((s) => `${s.path}.new`),
  };
}

/** The project folder. Every write and removal goes through it, and it refuses a path outside the folder. */
export class Project {
  private realRoot: string | undefined;
  constructor(readonly root: string) {}

  /** The absolute path of `path`, after checking that it stays inside the project. */
  async inside(path: string): Promise<string> {
    const full = resolve(this.root, path);
    const rel = relative(this.root, full);
    if (rel === "" || rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel))
      throw new Problem(`Refused to touch ${path}: it is outside the project folder ${this.root}.`);
    // A symbolic link on the way could lead outside: check the deepest folder that exists.
    this.realRoot ??= await realpath(this.root);
    let probe = dirname(full);
    for (;;) {
      try {
        const real = await realpath(probe);
        if (real !== this.realRoot && !real.startsWith(this.realRoot + sep))
          throw new Problem(`Refused to touch ${path}: a link in its folder leads outside the project.`);
        break;
      } catch (error) {
        if (error instanceof Problem) throw error;
        if (probe === this.root) break;
        probe = dirname(probe);
      }
    }
    return full;
  }

  async hash(path: string): Promise<string | undefined> {
    const full = resolve(this.root, path);
    try {
      if (!(await lstat(full)).isFile()) return undefined;
    } catch {
      return undefined;
    }
    return sha256(new Uint8Array(await Bun.file(full).arrayBuffer()));
  }

  async write(path: string, data: Uint8Array | string): Promise<void> {
    const full = await this.inside(path);
    await mkdir(dirname(full), { recursive: true });
    await Bun.write(full, data);
  }

  /** Removes a file and then the folders it leaves empty, up to (not including) `stop`. */
  async remove(path: string, stop: string): Promise<void> {
    const full = await this.inside(path);
    await rm(full, { force: true });
    const top = resolve(this.root, stop);
    for (let dir = dirname(full); dir.startsWith(top + sep); dir = dirname(dir)) {
      if ((await readdir(dir)).length > 0) break;
      await rmdir(dir);
    }
  }
}

/** Hashes on disk of every path the plan looks at. */
export async function diskHashes(
  project: Project,
  paths: Iterable<string>,
): Promise<Map<string, string | undefined>> {
  const out = new Map<string, string | undefined>();
  for (const path of new Set(paths)) out.set(path, await project.hash(path));
  return out;
}

/** Carries the plan out. `stopAt(path)` names the folder above which empty folders are kept. */
export async function applyPlan(
  project: Project,
  steps: readonly Step[],
  wanted: ReadonlyMap<string, Wanted>,
  stopAt: (path: string) => string,
): Promise<void> {
  for (const step of steps) {
    const file = wanted.get(step.path);
    if ((step.kind === "add" || step.kind === "change") && file)
      await project.write(step.path, await file.data());
    else if (step.kind === "kept" && step.writeNew && file)
      await project.write(`${step.path}.new`, await file.data());
    else if (step.kind === "remove") await project.remove(step.path, stopAt(step.path));
  }
}

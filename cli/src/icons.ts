/** The icon sprite of a project: the icons its source files name, plus the ones it adds by hand. */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { Glob } from "bun";
import { buildSprite, findIconNames, type IconData } from "../../core/src/sprite";
import { Problem } from "./errors";

/** Folders the scan never enters, by name anywhere in the tree. */
const SKIP_NAMES = new Set(["node_modules", ".git", "dist", "vendor"]);

/** Reads every file that matches one of the globs and returns the icon names in them, sorted. */
export async function scanIcons(
  root: string,
  globs: readonly string[],
  skipPaths: readonly string[],
): Promise<string[]> {
  const matchers = globs.map((g) => new Glob(g));
  const skip = new Set(skipPaths);
  const names = new Set<string>();
  const walk = async (rel: string): Promise<void> => {
    const entries = await readdir(join(root, rel), { withFileTypes: true });
    for (const entry of entries) {
      const path = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIP_NAMES.has(entry.name) && !skip.has(path)) await walk(path);
      } else if (entry.isFile() && matchers.some((m) => m.match(path))) {
        for (const name of findIconNames(await Bun.file(join(root, path)).text())) names.add(name);
      }
    }
  };
  await walk("");
  return [...names].sort();
}

/** The sprite; names that no icon set has are an error that lists them. */
export function spriteOf(names: readonly string[], sets: Readonly<Record<string, IconData>>): string {
  const { sprite, missing } = buildSprite(names, sets);
  if (missing.length > 0)
    throw new Problem(
      `Unknown icons: ${missing.join(", ")}.`,
      "Fix the names in the source (sets: bi, simple-icons), or remove them from icons.add in tailor.json.",
    );
  return sprite;
}

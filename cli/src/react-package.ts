/** The package.json of the React kit tree: one export per pack, the kit files, the libraries as peers. */
import type { PackSpec } from "../../core/src/packs";

export interface ReactPackage {
  readonly name: "tailor";
  readonly version: string;
  readonly private: true;
  readonly type: "module";
  readonly license: "MIT";
  readonly exports: Record<string, string>;
  readonly peerDependencies: Record<string, string>;
  readonly peerDependenciesMeta?: Record<string, { optional: true }>;
}

/**
 * `paths` are release paths (react/<pack>/index.ts, react/kit/<file>). With `installed`, only those packs,
 * and their libraries are plain peers; without it, every pack, and every library is an optional peer.
 */
export function reactPackage(
  version: string,
  packs: readonly PackSpec[],
  paths: readonly string[],
  installed?: readonly string[],
): ReactPackage {
  const has = new Set(paths);
  const chosen = packs.filter((p) => !installed || installed.includes(p.id));
  const exports: Record<string, string> = {};
  for (const p of chosen) if (has.has(`react/${p.id}/index.ts`)) exports[`./${p.id}`] = `./${p.id}/index.ts`;
  const kit = paths.filter((p) => /^react\/kit\/[^/]+\.tsx?$/.test(p)).sort();
  if (kit.some((p) => p.endsWith(".tsx"))) exports["./kit/*"] = "./kit/*.tsx";
  for (const p of kit.filter((p) => p.endsWith(".ts"))) {
    const file = p.slice("react/".length);
    exports[`./${file.replace(/\.ts$/, "")}`] = `./${file}`;
  }
  const peers: Record<string, string> = {};
  for (const p of chosen) Object.assign(peers, p.libraries);
  const sorted = Object.fromEntries(Object.entries(peers).sort(([a], [b]) => a.localeCompare(b)));
  return {
    name: "tailor",
    version,
    private: true,
    type: "module",
    license: "MIT",
    exports,
    peerDependencies: sorted,
    ...(installed
      ? {}
      : {
          peerDependenciesMeta: Object.fromEntries(
            Object.keys(sorted).map((n) => [n, { optional: true as const }]),
          ),
        }),
  };
}

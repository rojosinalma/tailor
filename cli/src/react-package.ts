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
 * Type packages are always optional peers: the project compiles this source with its own TypeScript, so
 * the project must have them (a peer), and a project without TypeScript needs none (optional). As dev
 * dependencies of a vendored package they would never be installed.
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
  const types: Record<string, string> = {};
  for (const p of chosen) {
    Object.assign(peers, p.libraries);
    Object.assign(types, p.devLibraries ?? {});
  }
  const sorted = Object.fromEntries(
    Object.entries({ ...peers, ...types }).sort(([a], [b]) => a.localeCompare(b)),
  );
  const optional = installed ? Object.keys(types) : Object.keys(sorted);
  return {
    name: "tailor",
    version,
    private: true,
    type: "module",
    license: "MIT",
    exports,
    peerDependencies: sorted,
    ...(optional.length
      ? {
          peerDependenciesMeta: Object.fromEntries(
            optional.sort().map((n) => [n, { optional: true as const }]),
          ),
        }
      : {}),
  };
}

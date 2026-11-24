/**
 * Makes the release artifact from the build: dist/release/tailor-<version>/ and its .tgz.
 * The React kit goes in as source with every import rewritten to a relative one, and is type-checked
 * with no path aliases, the way a project compiles its copy.
 */
import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, posix } from "node:path";
import { Glob } from "bun";
import { HEAD_TEMPLATE } from "../../cli/src/head";
import {
  type Breaking,
  type ChangelogEntry,
  type Manifest,
  type ManifestFile,
  parseManifest,
} from "../../cli/src/manifest";
import { sha256 } from "../../cli/src/plan";
import { reactPackage } from "../../cli/src/react-package";
import { packFile, renderIndex, renderPack } from "../../cli/src/reference-md";
import { storeDir } from "../../cli/src/store";
import { PACK_GLYPHS } from "../../core/src/glyph-icons.gen";
import { type PackSpec, withRequirements } from "../../core/src/packs";
import type { ComponentSpec } from "../../core/src/spec";
import { ICON_SETS } from "../../core/src/sprite";
import { DEFAULT_PALETTE, DEFAULT_SKIN } from "./build-showcase";
import { at, ROOT } from "./paths";
import { buildReference, loadExamples, renderExample } from "./reference";

/** The path aliases of the repository (tsconfig.json → paths), without the "/*". */
export const ALIASES: Readonly<Record<string, string>> = {
  "@tailor/core": "core/src",
  "@tailor/packs": "core/packs",
  "@tailor/react": "react/src",
  "@tailor/html": "html/src",
};

/** The service worker script of the pwa pack. */
const SERVICE_WORKER = "tailor-sw.js";

const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;

const dropGen = (path: string): string => path.replace(/\.gen$/, "");

/**
 * Where a module of the repository (path without extension) lies in the release, or undefined when it
 * has no place in the React kit tree.
 */
export function moduleTarget(module: string): string | undefined {
  const parts = module.split("/");
  if (parts[0] === "react" && parts[1] === "src") {
    if (parts.length === 3) return parts[2] === "examples" ? undefined : `react/kit/${parts[2]}`;
    if (parts.length === 4 && parts[3] === "index.gen") return `react/${parts[2]}/index`;
    // Examples and the sample data they share are showcase content, not part of the kit.
    if (parts.at(-1) === "examples" || parts.at(-1) === "sample") return undefined;
    return `react/${dropGen(parts.slice(2).join("/"))}`;
  }
  if (parts[0] === "core" && parts[1] === "src" && parts.length === 3)
    return `react/lib/core/${dropGen(parts[2] ?? "")}`;
  if (parts[0] === "core" && parts[1] === "packs")
    return `react/lib/packs/${dropGen(parts.slice(2).join("/"))}`;
  return undefined;
}

const stripExtension = (path: string): string => path.replace(/\.(tsx?|jsx?)$/, "");

/** The release path of a repository file, keeping its extension. */
export function targetPath(file: string): string | undefined {
  const ext = /\.(tsx?)$/.exec(file)?.[0] ?? "";
  const target = moduleTarget(stripExtension(file));
  return target === undefined ? undefined : `${target}${ext}`;
}

/** The repository module an import names (path without extension), or undefined for a library. */
export function resolveSpecifier(file: string, specifier: string): string | undefined {
  for (const [alias, dir] of Object.entries(ALIASES)) {
    if (specifier.startsWith(`${alias}/`))
      return stripExtension(`${dir}/${specifier.slice(alias.length + 1)}`);
  }
  if (specifier.startsWith("./") || specifier.startsWith("../"))
    return stripExtension(posix.join(posix.dirname(file), specifier));
  return undefined;
}

/**
 * The specifier to use in the release: given the file's old path, its new path and the old specifier,
 * the relative specifier that reaches the same module inside the release. A library stays as it is.
 */
export function rewriteSpecifier(oldPath: string, newPath: string, specifier: string): string {
  const module = resolveSpecifier(oldPath, specifier);
  if (module === undefined) return specifier;
  const target = moduleTarget(module);
  if (target === undefined)
    throw new Error(`${oldPath}: "${specifier}" leads to ${module}, which the release does not carry`);
  const rel = posix.relative(posix.dirname(newPath), target);
  return rel.startsWith(".") ? rel : `./${rel}`;
}

/** Static imports and re-exports at the start of a line, side-effect imports, and dynamic imports. */
const IMPORT = /(^(?:import|export)\s[^;()=]*?\bfrom\s*|^import\s*|\bimport\(\s*)(["'])([^"'\n]+)\2/gm;

/** Every import specifier in a source text. */
export const importsOf = (source: string): string[] =>
  [...source.matchAll(IMPORT)].flatMap((m) => (m[3] ? [m[3]] : []));

/** The source with every import rewritten for its new place. */
export const rewriteImports = (source: string, oldPath: string, newPath: string): string =>
  source.replace(
    IMPORT,
    (_all, lead: string, quote: string, spec: string) =>
      `${lead}${quote}${rewriteSpecifier(oldPath, newPath, spec)}${quote}`,
  );

/** The package an import of a library names: "highlight.js/lib/core" → "highlight.js". */
export const packageOf = (specifier: string): string =>
  specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/");

const scan = async (pattern: string): Promise<string[]> =>
  (await Array.fromAsync(new Glob(pattern).scan({ cwd: ROOT, onlyFiles: true }))).sort();

const isTest = (path: string): boolean => /\.test\.tsx?$/.test(path);

/** The pack a source file of the React kit tree belongs to. */
function packOfSource(file: string): string {
  const parts = file.split("/");
  if (parts[0] === "react") return parts.length === 3 ? "core" : (parts[2] ?? "core");
  if (parts[1] === "src") return "core";
  return parts[2] ?? "core";
}

function resolveFile(module: string): string | undefined {
  for (const ext of SOURCE_EXTENSIONS) if (existsSync(at(`${module}${ext}`))) return `${module}${ext}`;
  return undefined;
}

interface BuildManifest {
  readonly version: string;
  readonly packs: readonly PackSpec[];
  readonly components: readonly ComponentSpec[];
  readonly skins: Manifest["skins"];
  readonly palettes: Manifest["palettes"];
}

/** The source files of the React kit tree: the kit, the components and the shared code they import. */
async function reactSources(): Promise<{ files: string[]; problems: string[] }> {
  const files = new Set<string>();
  const problems: string[] = [];
  for (const f of await scan("react/src/**/*.{ts,tsx}")) if (!isTest(f) && targetPath(f)) files.add(f);
  for (const f of await scan("core/packs/**/*.ts")) if (!isTest(f)) files.add(f);
  // Shared code under core/src comes in when something imports it.
  const queue = [...files];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    for (const spec of importsOf(await Bun.file(at(file)).text())) {
      const module = resolveSpecifier(file, spec);
      if (module === undefined) continue;
      const found = resolveFile(module);
      if (!found || !targetPath(found)) {
        problems.push(`${file}: "${spec}" leads to ${found ?? module}, which the React kit cannot carry`);
        continue;
      }
      if (!files.has(found)) {
        files.add(found);
        queue.push(found);
      }
    }
  }
  return { files: [...files].sort(), problems };
}

/** Each file may import only from its own pack, the packs that one requires, and their libraries. */
async function checkPackBounds(files: readonly string[], packs: readonly PackSpec[]): Promise<string[]> {
  const problems: string[] = [];
  const known = new Set(packs.map((p) => p.id));
  for (const file of files) {
    const pack = packOfSource(file);
    if (!known.has(pack)) {
      problems.push(`${file}: the folder names no known pack "${pack}"`);
      continue;
    }
    const allowed = new Set(withRequirements([pack]));
    const libraries = new Set(
      packs.filter((p) => allowed.has(p.id)).flatMap((p) => Object.keys(p.libraries)),
    );
    for (const spec of importsOf(await Bun.file(at(file)).text())) {
      const module = resolveSpecifier(file, spec);
      if (module === undefined) {
        if (!libraries.has(packageOf(spec)))
          problems.push(
            `${file}: imports "${spec}", but no library of the pack ${pack} or its requirements is ${packageOf(spec)}`,
          );
        continue;
      }
      const found = resolveFile(module);
      const other = found ? packOfSource(found) : pack;
      if (!allowed.has(other))
        problems.push(`${file}: imports "${spec}" from the pack ${other}, which ${pack} does not require`);
    }
  }
  return problems;
}

interface License {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly url: string;
  readonly scripts: string[];
}

/** The libraries bundled into the HTML kit scripts, from the bundler's list of inputs. */
async function bundledLibraries(packs: readonly PackSpec[]): Promise<License[]> {
  const found = new Map<string, License>();
  for (const pack of packs) {
    const entry = at(`html/src/${pack.id}/index.gen.ts`);
    if (!existsSync(entry)) continue;
    const config: Bun.BuildConfig & { metafile: true } = {
      entrypoints: [entry],
      format: "iife",
      target: "browser",
      metafile: true,
    };
    const result = (await Bun.build(config)) as Awaited<ReturnType<typeof Bun.build>> & {
      metafile?: { inputs: Record<string, unknown> };
    };
    if (!result.success || !result.metafile) throw new Error(`HTML kit: the pack ${pack.id} did not build`);
    const script = `html/${pack.id === "core" ? "tailor" : `tailor-${pack.id}`}.js`;
    for (const input of Object.keys(result.metafile.inputs)) {
      const m = /^(.*node_modules\/)((?:@[^/]+\/)?[^/]+)\//.exec(input);
      if (!m?.[1] || !m[2]) continue;
      const known = found.get(m[2]);
      if (known) {
        if (!known.scripts.includes(script)) known.scripts.push(script);
        continue;
      }
      const pkg = (await Bun.file(at(`${m[1]}${m[2]}/package.json`)).json()) as {
        version: string;
        license?: string | { type?: string };
        homepage?: string;
        repository?: string | { url?: string };
      };
      const license =
        typeof pkg.license === "string" ? pkg.license : (pkg.license?.type ?? "see the package");
      const repo = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
      const url =
        pkg.homepage ??
        repo?.replace(/^git\+/, "").replace(/\.git$/, "") ??
        `https://www.npmjs.com/package/${m[2]}`;
      found.set(m[2], { name: m[2], version: pkg.version, license, url, scripts: [script] });
    }
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function thirdParty(libraries: readonly License[]): string {
  return [
    "# Third-party code",
    "",
    "The HTML kit scripts bundle these libraries. Each keeps its own licence.",
    "",
    "| Library | Version | Licence | Address | In |",
    "| --- | --- | --- | --- | --- |",
    ...libraries.map(
      (l) => `| ${l.name} | ${l.version} | ${l.license} | ${l.url} | ${l.scripts.join(", ")} |`,
    ),
    "",
  ].join("\n");
}

/** CHANGELOG.md, when there is one: "## <version>" headings and their "- " lines. */
async function readChangelog(): Promise<ChangelogEntry[] | undefined> {
  const file = Bun.file(at("CHANGELOG.md"));
  if (!(await file.exists())) return undefined;
  const entries: { version: string; lines: string[] }[] = [];
  for (const line of (await file.text()).split("\n")) {
    const heading = /^##\s+\[?v?(\d+\.\d+\.\d+[^\]\s]*)\]?/.exec(line);
    if (heading?.[1]) entries.push({ version: heading[1], lines: [] });
    else if (/^\s*[-*]\s+/.test(line)) entries.at(-1)?.lines.push(line.replace(/^\s*[-*]\s+/, ""));
  }
  return entries;
}

async function readBreaking(): Promise<readonly Breaking[]> {
  const file = Bun.file(at("docs/breaking.json"));
  return (await file.exists()) ? ((await file.json()) as Breaking[]) : [];
}

const TSCONFIG = {
  compilerOptions: {
    target: "ES2023",
    lib: ["ES2023", "DOM", "DOM.Iterable"],
    module: "ESNext",
    moduleResolution: "bundler",
    jsx: "react-jsx",
    strict: true,
    noUncheckedIndexedAccess: true,
    verbatimModuleSyntax: true,
    skipLibCheck: true,
    noEmit: true,
    types: [],
  },
};

async function typeCheck(releaseDir: string): Promise<void> {
  const project = at("dist/release/.typecheck");
  await mkdir(project, { recursive: true });
  const name = releaseDir.split("/").pop() ?? "";
  const include = [`../${name}/react`];
  await Bun.write(`${project}/tsconfig.json`, JSON.stringify({ ...TSCONFIG, include }, null, 2));
  const proc = Bun.spawn(["bunx", "tsc", "-p", `${project}/tsconfig.json`], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(`The React kit in the release does not compile on its own:\n${out}${err}`);
  await rm(project, { recursive: true, force: true });
}

async function pack(name: string): Promise<Uint8Array> {
  const proc = Bun.spawn(
    [
      "tar",
      "--sort=name",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "--mtime=@0",
      "--mode=u+rwX,go+rX,go-w",
      "--format=gnu",
      "-cf",
      "-",
      "-C",
      at("dist/release"),
      name,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [data, err, code] = await Promise.all([
    new Response(proc.stdout).arrayBuffer(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(`tar failed: ${err}`);
  return Bun.gzipSync(new Uint8Array(data), { level: 9 });
}

export interface ReleaseResult {
  readonly dir: string;
  readonly tgz: string;
  readonly files: number;
  readonly bytes: number;
  readonly installed?: string;
}

export async function release(options: { install?: boolean } = {}): Promise<ReleaseResult> {
  const built = (await Bun.file(at("dist/manifest.json")).json()) as BuildManifest;
  const { version, packs, components } = built;
  const name = `tailor-${version}`;
  const dir = at("dist/release", name);
  await rm(at("dist/release"), { recursive: true, force: true });
  const files: ManifestFile[] = [];
  const put = async (path: string, data: string | Uint8Array, pack: string, kit?: ManifestFile["kit"]) => {
    await mkdir(dirname(`${dir}/${path}`), { recursive: true });
    await Bun.write(`${dir}/${path}`, data);
    files.push({ path, sha256: sha256(data), pack, ...(kit ? { kit } : {}) });
  };
  const bytes = async (path: string) => new Uint8Array(await Bun.file(at(path)).arrayBuffer());
  const packIds = new Set(packs.map((p) => p.id));
  const packOfAsset = (file: string): string => {
    if (file === SERVICE_WORKER) return "pwa";
    const id = /^tailor(?:-(.+))?\.(?:css|js)$/.exec(file)?.[1] ?? "core";
    if (!packIds.has(id)) throw new Error(`dist/${file}: no pack "${id}"`);
    return id;
  };

  // Stylesheets and the HTML kit, as built.
  for (const f of await scan("dist/css/**/*")) {
    const rel = f.slice("dist/".length);
    const sub = rel.split("/")[1] ?? "";
    const pack =
      sub === "skins" || sub === "fonts" ? "skins" : sub === "palettes" ? "palettes" : packOfAsset(sub);
    await put(rel, await bytes(f), pack, "both");
  }
  for (const f of await scan("dist/html/*.js")) {
    const name = f.split("/").pop() ?? "";
    // A React app serves the service worker too (its own sw.js imports it): it belongs to both kits.
    await put(
      f.slice("dist/".length),
      await bytes(f),
      packOfAsset(name),
      name === SERVICE_WORKER ? "both" : "html",
    );
  }
  await put("html/head.html", HEAD_TEMPLATE, "meta", "both");

  // The markup of every example, from the static render.
  for (const spec of components) {
    if (spec.html === "none") continue;
    const set = await loadExamples(spec);
    const sections = set.examples.map((e) => `<!-- Example: ${e.title} -->\n${renderExample(e)}\n`);
    const header = `<!-- ${spec.name} (${spec.id}), pack ${spec.pack}, tailor ${version}: the markup of each example. -->\n`;
    await put(`html/reference/${spec.pack}/${spec.id}.html`, header + sections.join("\n"), spec.pack, "html");
  }

  // The React kit as source.
  const { files: sources, problems } = await reactSources();
  problems.push(...(await checkPackBounds(sources, packs)));
  if (problems.length) throw new Error(`The React kit cannot be released:\n${problems.join("\n")}`);
  for (const file of sources) {
    const target = targetPath(file);
    if (!target) continue;
    const text = rewriteImports(await Bun.file(at(file)).text(), file, target);
    await put(target, text, packOfSource(file), "react");
  }
  await put(
    "react/package.json",
    `${JSON.stringify(
      reactPackage(
        version,
        packs,
        files.map((f) => f.path),
      ),
      null,
      2,
    )}\n`,
    "core",
    "react",
  );

  // Icon data, for the project's sprite.
  for (const set of ICON_SETS)
    await put(
      `icons/${set}.json`,
      await bytes(`node_modules/@iconify-json/${set}/icons.json`),
      "icons",
      "both",
    );

  // The reference for agents, the licences.
  const reference = await buildReference(version, packs, components);
  await put("REFERENCE.md", renderIndex(reference), "meta");
  for (const pack of reference.packs) await put(packFile(pack.id), renderPack(reference, pack), pack.id);
  await put("reference.json", `${JSON.stringify(reference, null, 2)}\n`, "meta");
  await put("THIRD-PARTY.md", thirdParty(await bundledLibraries(packs)), "meta");
  await put("LICENSE", await bytes("LICENSE"), "meta");

  const changelog = await readChangelog();
  const manifest: Manifest = {
    version,
    packs,
    components,
    skins: built.skins,
    palettes: built.palettes,
    theme: { skin: DEFAULT_SKIN, palette: DEFAULT_PALETTE },
    files: files.sort((a, b) => (a.path < b.path ? -1 : 1)),
    breaking: await readBreaking(),
    ...(changelog ? { changelog } : {}),
    glyphs: PACK_GLYPHS,
  };
  parseManifest(manifest, "the release manifest");
  await Bun.write(`${dir}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);

  await typeCheck(dir);
  const tgz = at("dist/release", `${name}.tgz`);
  const archive = await pack(name);
  await Bun.write(tgz, archive);
  await Bun.write(`${tgz}.sha256`, `${sha256(archive)}  ${name}.tgz\n`);

  let installed: string | undefined;
  if (options.install) {
    installed = `${storeDir()}/${version}`;
    await rm(installed, { recursive: true, force: true });
    await mkdir(dirname(installed), { recursive: true });
    await cp(dir, installed, { recursive: true });
  }
  return { dir, tgz, files: files.length + 1, bytes: archive.length, ...(installed ? { installed } : {}) };
}

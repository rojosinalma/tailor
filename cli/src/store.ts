/**
 * Where a release comes from: a folder or .tgz named with --from, the local release store, or a download
 * from the repository's releases (unpacked into the store, so each version is fetched once).
 */

import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { Problem } from "./errors";
import { type Manifest, parseManifest } from "./manifest";
import { sha256 } from "./plan";
import { compareVersions, isVersion } from "./version";

const API_TIMEOUT_MS = 15_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

/** The hosts of the releases. Tests point them at a local server. */
export interface Endpoints {
  readonly web: string;
  readonly api: string;
}
export const GITHUB: Endpoints = { web: "https://github.com", api: "https://api.github.com" };

/** The local release store: $TAILOR_RELEASES, else <cache>/tailor/releases. */
export function storeDir(env: Readonly<Record<string, string | undefined>> = process.env): string {
  if (env.TAILOR_RELEASES) return resolve(env.TAILOR_RELEASES);
  const cache = env.XDG_CACHE_HOME ? resolve(env.XDG_CACHE_HOME) : join(env.HOME ?? homedir(), ".cache");
  return join(cache, "tailor", "releases");
}

export interface Release {
  readonly dir: string;
  readonly manifest: Manifest;
  bytes(path: string): Promise<Uint8Array>;
  text(path: string): Promise<string>;
}

/** Reads a release folder and checks every file against the manifest. */
export async function loadRelease(dir: string): Promise<Release> {
  const file = Bun.file(join(dir, "manifest.json"));
  if (!(await file.exists()))
    throw new Problem(
      `${dir} is not a tailor release: it has no manifest.json.`,
      "Name a release folder or .tgz.",
    );
  let value: unknown;
  try {
    value = await file.json();
  } catch {
    throw new Problem(`${dir}/manifest.json is not valid JSON.`, "Take the release again.");
  }
  const manifest = parseManifest(value, join(dir, "manifest.json"));
  const bytes = async (path: string): Promise<Uint8Array> =>
    new Uint8Array(await Bun.file(join(dir, path)).arrayBuffer());
  for (const f of manifest.files) {
    const found = Bun.file(join(dir, f.path));
    if (!(await found.exists()) || sha256(await bytes(f.path)) !== f.sha256)
      throw new Problem(
        `The release in ${dir} is damaged: ${f.path} is missing or differs from its manifest.`,
        `Remove ${dir} and run the command again.`,
      );
  }
  return { dir, manifest, bytes, text: (path) => Bun.file(join(dir, path)).text() };
}

/** "github:owner/repo" → its parts. */
export function parseSource(source: string): { owner: string; repo: string } {
  const m = /^github:([\w.-]+)\/([\w.-]+)$/.exec(source);
  if (!m?.[1] || !m[2])
    throw new Problem(
      `Unknown release source "${source}".`,
      'Set "source" in tailor.json to github:<owner>/<repo>.',
    );
  return { owner: m[1], repo: m[2] };
}

/** The versions in the store, highest first. */
export async function localVersions(store: string): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(store);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of names) {
    if (isVersion(name) && (await Bun.file(join(store, name, "manifest.json")).exists())) out.push(name);
  }
  return out.sort((a, b) => compareVersions(b, a));
}

async function run(cmd: string[]): Promise<void> {
  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn(cmd, { stdout: "ignore", stderr: "pipe" });
  } catch {
    throw new Problem(`Could not run ${cmd[0]}.`, `Install ${cmd[0]} and run the command again.`);
  }
  const code = await proc.exited;
  if (code !== 0) {
    const err = proc.stderr instanceof ReadableStream ? await new Response(proc.stderr).text() : "";
    throw new Problem(`${cmd.join(" ")} failed: ${err.trim() || `exit code ${code}`}`);
  }
}

/** Unpacks a release .tgz and moves its folder to `target`. Returns `target`. */
export async function unpack(tgz: string, target: string): Promise<string> {
  const temp = `${target}.unpack-${process.pid}`;
  await rm(temp, { recursive: true, force: true });
  await mkdir(temp, { recursive: true });
  try {
    await run(["tar", "-xzf", tgz, "-C", temp]);
    const top = await readdir(temp);
    const inner =
      top.length === 1 && top[0] && !(await Bun.file(join(temp, "manifest.json")).exists())
        ? join(temp, top[0])
        : temp;
    if (!(await Bun.file(join(inner, "manifest.json")).exists()))
      throw new Problem(`${tgz} holds no tailor release (no manifest.json).`);
    await rm(target, { recursive: true, force: true });
    await rename(inner, target);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  return target;
}

async function request(url: string, timeout: number): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { "user-agent": "tailor" } });
  } catch (error) {
    const why =
      error instanceof Error && error.name === "TimeoutError"
        ? `no answer in ${timeout / 1000} s`
        : String(error);
    throw new Problem(
      `Could not reach ${url}: ${why}.`,
      "Check the network, or use --offline or --from <path>.",
    );
  }
}

export async function latestVersion(source: string, endpoints: Endpoints = GITHUB): Promise<string> {
  const { owner, repo } = parseSource(source);
  const url = `${endpoints.api}/repos/${owner}/${repo}/releases/latest`;
  const res = await request(url, API_TIMEOUT_MS);
  if (!res.ok) throw new Problem(`${url} answered ${res.status}.`, "Name a version with --version or --to.");
  const tag = ((await res.json()) as { tag_name?: unknown }).tag_name;
  const version = typeof tag === "string" ? tag.replace(/^v/, "") : "";
  if (!isVersion(version)) throw new Problem(`${url} names no version (tag "${String(tag)}").`);
  return version;
}

/** Downloads a version into the store, checks its sha256 when the release has one, and unpacks it. */
export async function download(
  source: string,
  version: string,
  store: string,
  endpoints: Endpoints = GITHUB,
): Promise<string> {
  const { owner, repo } = parseSource(source);
  const name = `tailor-${version}.tgz`;
  const url = `${endpoints.web}/${owner}/${repo}/releases/download/v${version}/${name}`;
  const res = await request(url, DOWNLOAD_TIMEOUT_MS);
  if (!res.ok)
    throw new Problem(`${url} answered ${res.status}.`, `Check that the release v${version} exists.`);
  const data = new Uint8Array(await res.arrayBuffer());
  const sum = await request(`${url}.sha256`, API_TIMEOUT_MS);
  if (sum.ok) {
    const expected = (await sum.text()).trim().split(/\s+/)[0];
    if (expected !== sha256(data))
      throw new Problem(
        `${name} does not match its published sha256: the download is damaged.`,
        "Run the command again.",
      );
  } else if (sum.status !== 404) throw new Problem(`${url}.sha256 answered ${sum.status}.`);
  await mkdir(store, { recursive: true });
  const file = join(store, `${name}.part-${process.pid}`);
  await Bun.write(file, data);
  try {
    return await unpack(file, join(store, version));
  } finally {
    await rm(file, { force: true });
  }
}

export interface Find {
  readonly from?: string;
  readonly version?: string;
  readonly source: string;
  readonly offline: boolean;
  readonly store: string;
  readonly endpoints?: Endpoints;
  /** Lines for the user about where the release came from. */
  readonly notes: string[];
}

/** Finds the release: --from, then the store, then a download. */
export async function findRelease(find: Find): Promise<Release> {
  const { from, version, source, offline, store, endpoints, notes } = find;
  if (from) {
    const path = resolve(from);
    let isDir: boolean;
    try {
      isDir = (await stat(path)).isDirectory();
    } catch {
      throw new Problem(`--from ${from}: no such file or folder.`);
    }
    let dir = path;
    if (!isDir) {
      await mkdir(store, { recursive: true });
      dir = await unpack(path, join(store, `.from-${basename(path)}-${process.pid}`));
    }
    try {
      const release = await loadRelease(dir);
      if (version && release.manifest.version !== version)
        throw new Problem(`--from ${from} holds version ${release.manifest.version}, not ${version}.`);
      notes.push(`release ${release.manifest.version} from ${from}`);
      return isDir ? release : await keepInStore(release, store);
    } finally {
      if (!isDir) await rm(dir, { recursive: true, force: true });
    }
  }
  let wanted = version;
  if (!wanted) {
    const local = await localVersions(store);
    if (offline) {
      wanted = local[0];
      if (!wanted)
        throw new Problem(
          `The release store ${store} is empty.`,
          "Run once without --offline, or use --from.",
        );
    } else {
      try {
        wanted = await latestVersion(source, endpoints);
        // A local build newer than the latest published release (bin/build --release --install) wins.
        if (local[0] && compareVersions(local[0], wanted) > 0) {
          notes.push(`the store has ${local[0]}, newer than the latest published release ${wanted}`);
          wanted = local[0];
        }
      } catch (error) {
        if (!local[0]) throw error;
        wanted = local[0];
        notes.push(
          `could not ask for the latest version (${error instanceof Error ? error.message : error}); using ${wanted}, the highest in the store`,
        );
      }
    }
  }
  const dir = join(store, wanted);
  if (await Bun.file(join(dir, "manifest.json")).exists()) {
    notes.push(`release ${wanted} from the store`);
    return loadRelease(dir);
  }
  if (offline)
    throw new Problem(
      `Version ${wanted} is not in the release store ${store}.`,
      "Run without --offline to download it.",
    );
  await download(source, wanted, store, endpoints);
  notes.push(`release ${wanted} downloaded into the store`);
  return loadRelease(dir);
}

/** A release unpacked from --from <file.tgz> lives in the store under its version, like a download. */
async function keepInStore(release: Release, store: string): Promise<Release> {
  const dir = join(store, release.manifest.version);
  await rm(dir, { recursive: true, force: true });
  await rename(release.dir, dir);
  return loadRelease(dir);
}

/** Which release files a project gets, and where they go, for its kit and packs. */
import type { Kit, Manifest, ManifestFile } from "./manifest";

export interface Placement {
  /** Path inside the release. */
  readonly from: string;
  /** Path inside the project. */
  readonly to: string;
  readonly sha256: string;
  readonly pack: string;
}

export interface Folders {
  readonly public: string;
  readonly vendor: string;
}

/** The tailor folder under the public folder, and the one under the vendor folder. */
export const publicRoot = (f: Folders): string => `${f.public}/tailor`;
export const vendorRoot = (f: Folders): string => `${f.vendor}/tailor`;

/** Packs whose files every project gets, whatever packs it has. */
const ALWAYS = new Set(["skins", "palettes", "meta"]);

/** Where one release file goes in a project of this kit; empty when it does not go anywhere. */
export function targets(file: ManifestFile, kit: Kit, folders: Folders): string[] {
  const p = file.path;
  const pub = publicRoot(folders);
  const ven = vendorRoot(folders);
  if (p.startsWith("css/")) return [`${pub}/${p}`];
  if (kit === "html" && p.startsWith("html/reference/"))
    return [`${pub}/reference/${p.slice("html/reference/".length)}`];
  if (kit === "html" && /^html\/[^/]+\.js$/.test(p)) return [`${pub}/js/${p.slice("html/".length)}`];
  // The package file of the React kit is made per project (only the installed packs).
  if (kit === "react" && p.startsWith("react/") && p !== "react/package.json")
    return [`${ven}/${p.slice("react/".length)}`];
  if (p === "LICENSE") return kit === "react" ? [`${pub}/LICENSE`, `${ven}/LICENSE`] : [`${pub}/LICENSE`];
  if (p === "THIRD-PARTY.md" && kit === "html") return [`${pub}/THIRD-PARTY.md`];
  return [];
}

/** Every release file the project gets, for its kit, its packs (with requirements) and its folders. */
export function selectFiles(
  manifest: Manifest,
  kit: Kit,
  packs: readonly string[],
  folders: Folders,
): Placement[] {
  const installed = new Set(packs);
  const out: Placement[] = [];
  for (const file of manifest.files) {
    if (!installed.has(file.pack) && !ALWAYS.has(file.pack)) continue;
    if (file.kit && file.kit !== "both" && file.kit !== kit) continue;
    for (const to of targets(file, kit, folders))
      out.push({ from: file.path, to, sha256: file.sha256, pack: file.pack });
  }
  return out;
}

/** The stylesheets and scripts a page loads, in order: core first, then the packs, the shell last. */
export function pageAssets(
  manifest: Manifest,
  kit: Kit,
  packs: readonly string[],
): { stylesheets: string[]; scripts: string[] } {
  const shells = new Set(manifest.packs.filter((p) => p.shell).map((p) => p.id));
  const ordered = [...packs.filter((p) => !shells.has(p)), ...packs.filter((p) => shells.has(p))];
  const has = new Set(manifest.files.map((f) => f.path));
  const name = (pack: string) => (pack === "core" ? "tailor" : `tailor-${pack}`);
  return {
    stylesheets: ordered.map((p) => `${name(p)}.css`).filter((f) => has.has(`css/${f}`)),
    scripts: kit === "html" ? ordered.map((p) => `${name(p)}.js`).filter((f) => has.has(`html/${f}`)) : [],
  };
}

/** The libraries the React kit needs for these packs, with their pinned versions. */
export function librariesOf(manifest: Manifest, packs: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of manifest.packs) if (packs.includes(p.id)) Object.assign(out, p.libraries);
  return out;
}

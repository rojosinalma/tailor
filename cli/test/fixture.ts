/** A small fake release for the tests: a manifest and a few files, written into a folder. */
import { mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { PackSpec } from "../../core/src/packs";
import { HEAD_TEMPLATE } from "../src/head";
import type { Manifest, ManifestFile } from "../src/manifest";
import { sha256 } from "../src/plan";
import type { Reference } from "../src/reference-md";

/** Scratch folders of the tests live under the repository's .cache/, never in the system temp folder. */
export const SCRATCH = resolve(import.meta.dir, "../../.cache/cli-tests");

export async function scratch(name: string): Promise<string> {
  const dir = join(SCRATCH, `${name}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  return dir;
}

export const PACKS: readonly PackSpec[] = [
  {
    id: "core",
    name: "Core",
    description: "The base.",
    requires: [],
    libraries: { react: "19.0.0" },
    html: "full",
  },
  {
    id: "shell-top",
    name: "Top shell",
    description: "A top bar.",
    requires: ["core"],
    libraries: {},
    html: "full",
    shell: true,
  },
  {
    id: "extra",
    name: "Extra",
    description: "More.",
    requires: ["core"],
    libraries: { "lib-x": "1.0.0" },
    html: { partial: "the view" },
  },
  {
    id: "deep",
    name: "Deep",
    description: "Needs extra.",
    requires: ["extra"],
    libraries: { "lib-y": "2.0.0" },
    html: "full",
  },
  {
    id: "react-only",
    name: "React only",
    description: "No HTML.",
    requires: ["core"],
    libraries: {},
    html: "none",
  },
];

const ICONS = JSON.stringify({
  prefix: "bi",
  icons: { house: { body: "<path d='M0 0'/>" }, gear: { body: "<path/>" } },
});

/** The files of a version. `v2` changes one file, drops one and adds one, so an upgrade has each case. */
export function releaseFiles(
  version: string,
): Record<string, { data: string; pack: string; kit?: ManifestFile["kit"] }> {
  const v2 = version !== "1.0.0";
  const files: Record<string, { data: string; pack: string; kit?: ManifestFile["kit"] }> = {
    LICENSE: { data: "MIT\n", pack: "meta" },
    "THIRD-PARTY.md": { data: "# Third-party code\n", pack: "meta" },
    "css/tailor.css": { data: `.t-btn{v:${v2 ? 2 : 1}}`, pack: "core", kit: "both" },
    "css/tailor-extra.css": { data: ".t-x{}", pack: "extra", kit: "both" },
    "css/tailor-shell-top.css": { data: ".t-shell{}", pack: "shell-top", kit: "both" },
    "css/skins/plain.css": { data: ".s{}", pack: "skins", kit: "both" },
    "css/palettes/grey.css": { data: ".p{}", pack: "palettes", kit: "both" },
    "html/tailor.js": { data: "/*core*/", pack: "core", kit: "html" },
    "html/tailor-extra.js": { data: "/*extra*/", pack: "extra", kit: "html" },
    "html/head.html": { data: HEAD_TEMPLATE, pack: "meta", kit: "both" },
    "html/reference/core/button.html": {
      data: '<button class="t-btn">Save</button>',
      pack: "core",
      kit: "html",
    },
    "react/kit/kit.tsx": { data: "export const kit = 1;\n", pack: "core", kit: "react" },
    "react/core/index.ts": { data: 'export * from "./button/button";\n', pack: "core", kit: "react" },
    "react/core/button/button.tsx": {
      data: `export const Button = ${v2 ? 2 : 1};\n`,
      pack: "core",
      kit: "react",
    },
    "react/extra/index.ts": { data: "export const X = 1;\n", pack: "extra", kit: "react" },
    "react/deep/index.ts": { data: "export const Y = 1;\n", pack: "deep", kit: "react" },
    "react/react-only/index.ts": { data: "export const R = 1;\n", pack: "react-only", kit: "react" },
    "react/package.json": { data: "{}\n", pack: "core", kit: "react" },
    "icons/bi.json": { data: ICONS, pack: "icons", kit: "both" },
  };
  if (v2) {
    delete files["css/tailor-extra.css"];
    files["react/core/card/card.tsx"] = { data: "export const Card = 1;\n", pack: "core", kit: "react" };
  }
  const reference: Reference = {
    version,
    packs: PACKS.map((p) => ({ ...p, components: [] })),
  };
  files["reference.json"] = { data: JSON.stringify(reference), pack: "meta" };
  return files;
}

export function fixtureManifest(version: string): Manifest {
  return {
    version,
    packs: PACKS,
    components: [
      {
        id: "button",
        name: "Button",
        pack: "core",
        group: "actions",
        description: "Acts.",
        root: "t-btn",
        html: "markup",
      },
    ],
    skins: [{ id: "plain", name: "Plain" }],
    palettes: [{ id: "grey", name: "Grey" }],
    theme: { skin: "plain", palette: "grey" },
    files: Object.entries(releaseFiles(version))
      .map(([path, f]) => ({ path, sha256: sha256(f.data), pack: f.pack, ...(f.kit ? { kit: f.kit } : {}) }))
      .sort((a, b) => (a.path < b.path ? -1 : 1)),
    breaking:
      version === "1.0.0"
        ? []
        : [{ version, title: "Button takes a tone", steps: ["Replace variant=danger with tone=danger."] }],
    changelog: [{ version, lines: [`release ${version}`] }],
  };
}

/** Writes the release folder of a version and returns its path. */
export async function writeRelease(parent: string, version: string): Promise<string> {
  const dir = join(parent, `tailor-${version}`);
  for (const [path, f] of Object.entries(releaseFiles(version))) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await Bun.write(join(dir, path), f.data);
  }
  await Bun.write(join(dir, "manifest.json"), JSON.stringify(fixtureManifest(version), null, 2));
  return dir;
}

import { describe, expect, test } from "bun:test";
import { fixtureManifest } from "../test/fixture";
import { HEAD_TEMPLATE, headHtml, themeConfig } from "./head";
import { reactPackage } from "./react-package";
import { librariesOf, pageAssets, selectFiles } from "./select";

const manifest = fixtureManifest("1.0.0");
const folders = { public: "www", vendor: "src/vendor" };
const paths = (kit: "react" | "html", packs: string[]) =>
  selectFiles(manifest, kit, packs, folders)
    .map((p) => p.to)
    .sort();

describe("file selection per kit", () => {
  test("HTML kit: stylesheets, scripts and reference markup of the installed packs, every skin and palette", () => {
    expect(paths("html", ["core"])).toEqual([
      "www/tailor/LICENSE",
      "www/tailor/THIRD-PARTY.md",
      "www/tailor/css/palettes/grey.css",
      "www/tailor/css/skins/plain.css",
      "www/tailor/css/tailor.css",
      "www/tailor/js/tailor.js",
      "www/tailor/reference/core.md",
      "www/tailor/reference/core/button.html",
    ]);
    const extra = paths("html", ["core", "extra"]);
    expect(extra).toContain("www/tailor/js/tailor-extra.js");
    expect(extra).toContain("www/tailor/js/tailor-sw.js");
    expect(extra).toContain("www/tailor/reference/extra.md");
  });

  test("React kit: the stylesheets in public, the source tree in vendor, never the HTML kit files", () => {
    const got = paths("react", ["core", "extra"]);
    expect(got).toEqual([
      "src/vendor/tailor/LICENSE",
      "src/vendor/tailor/core/button/button.tsx",
      "src/vendor/tailor/core/index.ts",
      "src/vendor/tailor/extra/index.ts",
      "src/vendor/tailor/kit/kit.tsx",
      "src/vendor/tailor/reference/core.md",
      "src/vendor/tailor/reference/extra.md",
      "www/tailor/LICENSE",
      "www/tailor/css/palettes/grey.css",
      "www/tailor/css/skins/plain.css",
      "www/tailor/css/tailor-extra.css",
      "www/tailor/css/tailor.css",
      "www/tailor/js/tailor-sw.js",
    ]);
    // Without the pack that owns it, no service worker.
    expect(paths("react", ["core"])).not.toContain("www/tailor/js/tailor-sw.js");
  });

  test("a pack with no files installs nothing", () => {
    expect(paths("react", ["core", "react-only", "deep"])).not.toContain("www/tailor/css/tailor-deep.css");
  });
});

describe("page assets and head", () => {
  test("core first, the packs, the shell last; scripts only for the HTML kit", () => {
    expect(pageAssets(manifest, "html", ["core", "shell-top", "extra"])).toEqual({
      stylesheets: ["tailor.css", "tailor-extra.css", "tailor-shell-top.css"],
      scripts: ["tailor.js", "tailor-extra.js"],
    });
    expect(pageAssets(manifest, "react", ["core", "extra"]).scripts).toEqual([]);
  });

  test("head.html holds the viewport, the pre-paint script, the theme and the links in order", () => {
    const config = themeConfig(manifest, {
      key: "app",
      skin: "plain",
      palette: "grey",
      mode: "dark",
      base: "/static/tailor/css/",
    });
    const head = headHtml(HEAD_TEMPLATE, config, {
      stylesheets: ["tailor.css", "tailor-extra.css"],
      scripts: ["tailor.js"],
    });
    const lines = head.trimEnd().split("\n");
    expect(lines[0]).toContain("interactive-widget=resizes-content");
    expect(lines[1]).toStartWith("<script>(function(c){");
    expect(lines[1]).toContain('window.TAILOR_THEME={"key":"app"');
    expect(lines[1]).toContain('"labels":{"plain":"Plain","grey":"Grey"}');
    expect(lines.slice(2)).toEqual([
      '<link rel="stylesheet" href="/static/tailor/css/tailor.css">',
      '<link rel="stylesheet" href="/static/tailor/css/tailor-extra.css">',
      '<script defer src="/static/tailor/js/tailor.js"></script>',
    ]);
    expect(head).not.toContain("{{");
  });
});

describe("React package", () => {
  test("one export per pack with an index, the kit, libraries as peers", () => {
    const files = manifest.files.map((f) => f.path);
    const all = reactPackage("1.0.0", manifest.packs, files);
    expect(all.exports).toEqual({
      "./core": "./core/index.ts",
      "./extra": "./extra/index.ts",
      "./deep": "./deep/index.ts",
      "./react-only": "./react-only/index.ts",
      "./kit/*": "./kit/*.tsx",
    });
    expect(all.peerDependenciesMeta?.react).toEqual({ optional: true });
    const mine = reactPackage("1.0.0", manifest.packs, files, ["core", "extra"]);
    expect(Object.keys(mine.exports)).toEqual(["./core", "./extra", "./kit/*"]);
    // Type packages are optional peers, the libraries plain peers.
    expect(mine.peerDependencies).toEqual({ "@types/react": "19.0.0", "lib-x": "1.0.0", react: "19.0.0" });
    expect(mine.peerDependenciesMeta).toEqual({ "@types/react": { optional: true } });
    expect(librariesOf(manifest, ["core", "deep"], true)).toEqual({
      "@types/react": "19.0.0",
      "@types/lib-y": "2.0.0",
    });
    expect(librariesOf(manifest, ["core", "deep"])).toEqual({ react: "19.0.0", "lib-y": "2.0.0" });
  });
});

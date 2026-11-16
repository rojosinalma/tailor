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
      "www/tailor/reference/core/button.html",
    ]);
    expect(paths("html", ["core", "extra"])).toContain("www/tailor/js/tailor-extra.js");
  });

  test("React kit: the stylesheets in public, the source tree in vendor, never the HTML kit files", () => {
    const got = paths("react", ["core", "extra"]);
    expect(got).toEqual([
      "src/vendor/tailor/LICENSE",
      "src/vendor/tailor/core/button/button.tsx",
      "src/vendor/tailor/core/index.ts",
      "src/vendor/tailor/extra/index.ts",
      "src/vendor/tailor/kit/kit.tsx",
      "www/tailor/LICENSE",
      "www/tailor/css/palettes/grey.css",
      "www/tailor/css/skins/plain.css",
      "www/tailor/css/tailor-extra.css",
      "www/tailor/css/tailor.css",
    ]);
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
    expect(mine.peerDependencies).toEqual({ "lib-x": "1.0.0", react: "19.0.0" });
    expect(mine.peerDependenciesMeta).toBeUndefined();
    expect(librariesOf(manifest, ["core", "deep"])).toEqual({ react: "19.0.0", "lib-y": "2.0.0" });
  });
});

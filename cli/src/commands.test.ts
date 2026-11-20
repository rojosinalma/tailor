import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fixtureManifest, SCRATCH, scratch } from "../test/fixture";
import { removalPlan } from "./commands";
import { scanIcons, spriteOf } from "./icons";
import { DEFAULT_SCAN } from "./state";

afterAll(() => rm(SCRATCH, { recursive: true, force: true }));

describe("icon scan", () => {
  test("finds the names in source files, skips dependencies and tailor's own folders", async () => {
    const root = await scratch("icons");
    const files: Record<string, string> = {
      "index.html": '<svg><use href="/tailor/icons.svg#bi-house"></use></svg> <!-- bi:house -->',
      "src/app.tsx": '<Icon name="bi:gear" /> <Icon name="simple-icons:github" />',
      "src/notes.txt": "bi:not-read",
      "node_modules/x/index.js": "bi:never",
      "vendor/tailor/core/icon.tsx": "bi:never-either",
      "public/tailor/reference/core/x.html": "bi:skipped",
      "deep/a/b/view.j2": "{{ icon('bi:trash') }}",
      "templates/page.html": '<svg class="t-icon"><use href="/tailor/icons.svg#bi-x-lg"></use></svg>',
      "templates/brand.html": '<use href="/tailor/icons.svg#simple-icons-github"></use>',
    };
    for (const [path, text] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await Bun.write(join(root, path), text);
    }
    expect(await scanIcons(root, DEFAULT_SCAN, ["public/tailor", "vendor/tailor"])).toEqual([
      "bi:gear",
      "bi:house",
      "bi:trash",
      "bi:x-lg",
      "simple-icons:github",
    ]);
    expect(await scanIcons(root, ["src/**/*.tsx"], [])).toEqual(["bi:gear", "simple-icons:github"]);
  });

  test("an unknown name is an error that lists it", () => {
    const sets = { bi: { prefix: "bi", icons: { house: { body: "<path/>" } } } };
    expect(spriteOf(["bi:house"], sets)).toContain('<symbol id="bi-house"');
    expect(() => spriteOf(["bi:house", "bi:nope", "simple-icons:x"], sets)).toThrow(
      /Unknown icons: bi:nope, simple-icons:x/,
    );
  });
});

describe("remove plan", () => {
  const manifest = fixtureManifest("1.0.0");

  test("removes the pack and the packs only it needed, never core", () => {
    expect(removalPlan(manifest, ["core", "extra", "deep"], "deep")).toEqual({
      removed: ["deep", "extra"],
      remaining: ["core"],
    });
    expect(removalPlan(manifest, ["core", "extra", "deep", "shell-top"], "shell-top")).toEqual({
      removed: ["shell-top"],
      remaining: ["core", "extra", "deep"],
    });
    expect(() => removalPlan(manifest, ["core"], "core")).toThrow(/core cannot be removed/);
  });

  test("refuses a pack that another installed pack needs, or one that is not there", () => {
    expect(() => removalPlan(manifest, ["core", "extra", "deep"], "extra")).toThrow(
      /deep needs the pack extra/,
    );
    expect(() => removalPlan(manifest, ["core"], "extra")).toThrow(/not installed/);
  });
});

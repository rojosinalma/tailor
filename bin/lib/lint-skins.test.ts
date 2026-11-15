import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lintSkinExtras, lintSkinSpec, lintSkins } from "./lint-skins";
import { at } from "./paths";

const ids = (problems: { rule: string; line: number }[]) => problems.map((p) => [p.rule, p.line]);

/** A scratch folder of skins, inside the project and removed afterwards. */
const TMP = at(".agents/tmp", `lint-skins-${process.pid}`);
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const makeSkin = (id: string, files: Record<string, string>): string => {
  const folder = join(TMP, "skins", id);
  mkdirSync(join(folder, "fonts"), { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(folder, name), content);
  return folder;
};

const spec = (over: Record<string, unknown> = {}) => ({
  id: "demo",
  name: "Demo",
  about: "A neutral demo look, MIT.",
  source: { name: "Demo", url: "https://example.org", license: "MIT" },
  settings: { "radius-control": "0.25rem" },
  ...over,
});

describe("skin-spec", () => {
  test("passes for a valid spec with its font", () => {
    const folder = makeSkin("demo", { "fonts/demo.woff2": "" });
    const s = spec({ fonts: [{ family: "Demo", file: "demo.woff2", weight: "400", style: "normal" }] });
    expect(ids(lintSkinSpec("skin.json", s, folder))).toEqual([]);
  });

  test.each<[string, Record<string, unknown>]>([
    ["an unknown setting", { settings: { "radius-huge": "1rem" } }],
    ["a name with brackets", { name: "Demo (dark)" }],
    ["an id that differs from the folder", { id: "other" }],
    [
      "a missing font file",
      { fonts: [{ family: "Demo", file: "nope.woff2", weight: "400", style: "normal" }] },
    ],
    [
      "a font path outside fonts/",
      { fonts: [{ family: "Demo", file: "../x.woff2", weight: "400", style: "normal" }] },
    ],
    ["a wrong shape", { settings: { "radius-control": 4 } }],
  ])("fails for %s", (_, over) => {
    const folder = makeSkin("demo", {});
    expect(ids(lintSkinSpec("skin.json", spec(over), folder))).toEqual([["skin-spec", 1]]);
  });

  test("places the id problem on its JSON line", () => {
    const s = spec({ id: "other" });
    const text = JSON.stringify(s, null, 2);
    expect(ids(lintSkinSpec("skin.json", s, makeSkin("demo", {}), text))).toEqual([["skin-spec", 2]]);
  });
});

describe("setting-color", () => {
  test.each<[string, string]>([
    ["shadow-md", "0 4px 16px rgb(0 0 0 / 0.3)"],
    ["shadow-lg", "0 16px 48px rgb(0 0 0 / calc(0.45 * var(--t-shadow-strength)))"],
    ["btn-shadow", "inset 0 -1px 0 rgba(0, 0, 0, 0.2)"],
    ["card-shadow", "none"],
    ["focus-color", "var(--t-accent)"],
  ])("passes: %s = %s", (key, value) => {
    expect(
      ids(lintSkinSpec("skin.json", spec({ settings: { [key]: value } }), makeSkin("demo", {}))),
    ).toEqual([]);
  });

  test.each<[string, string]>([
    ["focus-color", "#ff0"],
    ["focus-color", "rgb(0 0 0 / 0.5)"],
    ["shadow-md", "0 4px 16px rgb(255 0 0 / 0.3)"],
    ["shadow-md", "0 4px 16px black"],
  ])("fails: %s = %s", (key, value) => {
    const s = spec({ settings: { [key]: value } });
    const text = JSON.stringify(s, null, 2);
    const line = text.split("\n").findIndex((l) => l.includes(`"${key}"`)) + 1;
    expect(ids(lintSkinSpec("skin.json", s, makeSkin("demo", {}), text))).toEqual([["setting-color", line]]);
  });
});

/** Lints extras whose line 2 is the given declaration. */
const extras = (d: string) => lintSkinExtras("extras.css", `.t-btn {\n  ${d};\n}\n`);

describe("extras-property", () => {
  test.each([
    "color: var(--t-text)",
    "border-bottom-width: 2px",
    "--t-x-glow: var(--t-accent)",
    "text-transform: uppercase",
    "border-top-left-radius: var(--t-radius-box)",
  ])("passes: %s", (d) => expect(ids(extras(d))).toEqual([]));

  test.each(["padding: var(--t-space-2)", "width: 100%", "margin-top: 0", "position: relative"])(
    "fails: %s",
    (d) => expect(ids(extras(d))).toEqual([["extras-property", 2]]),
  );
});

describe("extras-color", () => {
  test("passes with tokens", () =>
    expect(ids(extras("background: color-mix(in srgb, var(--t-surface), var(--t-text) 8%)"))).toEqual([]));
  test("fails with a literal", () => expect(ids(extras("background: #000"))).toEqual([["extras-color", 2]]));
});

describe("extras-length", () => {
  test.each([
    "border: 2px solid var(--t-border)",
    "outline-offset: 3px",
    "box-shadow: 0 2px 0 var(--t-border)",
    "text-underline-offset: 0.2em",
    "letter-spacing: 0.5px",
    "border-radius: var(--t-radius-control)",
    "border-radius: 50%",
    "border-radius: 0",
    "border-radius: inherit",
  ])("passes: %s", (d) => expect(ids(extras(d))).toEqual([]));

  test.each([
    "border-radius: 4px",
    "border-radius: 0.5em",
    "--t-x-size: 2rem",
    "background-image: linear-gradient(var(--t-surface) 2px, transparent)",
  ])("fails: %s", (d) => expect(ids(extras(d))).toEqual([["extras-length", 2]]));
});

describe("extras-at-rule", () => {
  test.each([
    "@media (hover: hover)",
    "@media (prefers-reduced-motion: reduce)",
    "@supports (backdrop-filter: blur(1em))",
  ])("passes: %s", (q) =>
    expect(ids(lintSkinExtras("extras.css", `${q} {\n  .t-btn { color: var(--t-text); }\n}\n`))).toEqual([]),
  );

  test.each(["@media (max-width: 48rem)", "@layer t.skin", '@import "x.css"', "@font-face"])(
    "fails: %s",
    (q) => {
      const css = q.startsWith("@import") ? `\n${q};\n` : `\n${q} {\n  color: var(--t-text);\n}\n`;
      expect(ids(lintSkinExtras("extras.css", css))).toEqual([["extras-at-rule", 2]]);
    },
  );
});

describe("extras-selector", () => {
  test.each([".t-btn:hover", "& .t-card-title", '[data-mode="light"] .t-btn'])("passes: %s", (sel) =>
    expect(ids(lintSkinExtras("extras.css", `\n${sel} {\n  color: var(--t-text);\n}\n`))).toEqual([]),
  );

  test.each([".btn", "#app .t-btn", '[data-skin="demo"] .t-btn', "[data-palette=nord] .t-btn"])(
    "fails: %s",
    (sel) =>
      expect(ids(lintSkinExtras("extras.css", `\n${sel} {\n  color: var(--t-text);\n}\n`))).toEqual([
        ["extras-selector", 2],
      ]),
  );
});

describe("important", () => {
  test("passes without it", () => expect(ids(extras("color: var(--t-text)"))).toEqual([]));
  test("fails with it", () =>
    expect(ids(extras("color: var(--t-text) !important"))).toEqual([["important", 2]]));
});

describe("lintSkins", () => {
  test("zero skins give zero problems", async () => {
    expect(await lintSkins(join(TMP, "none"))).toEqual([]);
  });

  test("lints every folder; a missing extras.css is a problem", async () => {
    const dir = join(TMP, "tree");
    const ok = join(dir, "demo");
    mkdirSync(ok, { recursive: true });
    writeFileSync(join(ok, "skin.json"), JSON.stringify(spec(), null, 2));
    writeFileSync(join(ok, "extras.css"), "");
    const bad = join(dir, "bare");
    mkdirSync(bad, { recursive: true });
    writeFileSync(join(bad, "skin.json"), JSON.stringify(spec({ id: "bare" }), null, 2));
    const problems = await lintSkins(dir);
    expect(problems.map((p) => [p.file.split("/").slice(-2).join("/"), p.rule])).toEqual([
      ["bare/extras.css", "skin-spec"],
    ]);
  });
});

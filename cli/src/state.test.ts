import { describe, expect, test } from "bun:test";
import { fixtureManifest } from "../test/fixture";
import { Problem } from "./errors";
import { parseManifest, withRequirements } from "./manifest";
import { DEFAULT_BASE, defaultKey, formatState, parseState, type State } from "./state";

const state: State = {
  tailor: "2.0.0",
  source: "github:owner/repo",
  kit: "react",
  shell: "top",
  packs: ["core", "extra"],
  public: "public",
  vendor: "vendor",
  theme: { key: "my-app", skin: "plain", palette: "grey", mode: "auto", base: DEFAULT_BASE },
  icons: { scan: ["src/**/*.tsx"], add: ["bi:house"] },
  files: { "public/tailor/css/b.css": "b".repeat(64), "public/tailor/css/a.css": "a".repeat(64) },
};

describe("the state file", () => {
  test("round trip: what is written reads back the same, files sorted", () => {
    const text = formatState(state);
    expect(parseState(JSON.parse(text))).toEqual(state);
    expect(text.indexOf("a.css")).toBeLessThan(text.indexOf("b.css"));
    expect(formatState(parseState(JSON.parse(text)))).toBe(text);
  });

  test("a project with no shell has no shell field", () => {
    const { shell: _, ...rest } = state;
    expect(formatState(rest)).not.toContain('"shell"');
    expect(parseState(JSON.parse(formatState(rest))).shell).toBeUndefined();
  });

  test("a bad file names the field", () => {
    const bad = (change: Record<string, unknown>) => () =>
      parseState({ ...JSON.parse(formatState(state)), ...change });
    expect(bad({ kit: "vue" })).toThrow(/"kit" must be one of react, html/);
    expect(bad({ tailor: "two" })).toThrow(/"tailor" must be a version/);
    expect(bad({ public: "../www" })).toThrow(/"public" must be a folder inside the project/);
    expect(bad({ files: { "../x": "a".repeat(64) } })).toThrow(Problem);
    expect(bad({ files: { x: "nope" } })).toThrow(/sha256/);
    expect(bad({ theme: { ...state.theme, base: '/x"><script>/' } })).toThrow(/theme.base/);
  });

  test("the key defaults to the folder name in kebab-case", () => {
    expect(defaultKey("/work/My App_2")).toBe("my-app-2");
    expect(defaultKey("/")).toBe("app");
  });
});

describe("the manifest", () => {
  test("a valid manifest reads back the same", () => {
    const m = fixtureManifest("2.0.0");
    expect(parseManifest(JSON.parse(JSON.stringify(m)))).toEqual(m);
  });

  test("a bad manifest names the field", () => {
    const m = JSON.parse(JSON.stringify(fixtureManifest("2.0.0")));
    m.files[0].path = "../outside";
    expect(() => parseManifest(m)).toThrow(/files\[0\]\.path/);
  });

  test("requirements come first, each once", () => {
    const { packs } = fixtureManifest("1.0.0");
    expect(withRequirements(packs, ["deep", "core", "extra"])).toEqual(["core", "extra", "deep"]);
    expect(() => withRequirements(packs, ["nope"])).toThrow(/no pack "nope"/);
  });
});

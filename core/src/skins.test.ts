import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { SKIN_SETTINGS, type SkinSpec, skinCss, validateSkin } from "./skins";

const DIR = join(import.meta.dir, "..", "skins");
const IDS = ["bootstrap", "luz", "pico", "primer", "simple", "webtui"];

const load = async (id: string): Promise<{ spec: SkinSpec; extras: string }> => ({
  spec: (await Bun.file(join(DIR, id, "skin.json")).json()) as SkinSpec,
  extras: await Bun.file(join(DIR, id, "extras.css")).text(),
});

describe("the skins", () => {
  test("are exactly the six skins", () => {
    const folders = readdirSync(DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(folders).toEqual(IDS);
  });

  test.each(IDS)("%s passes validateSkin, with a clean name and a source", async (id) => {
    const { spec } = await load(id);
    expect(validateSkin(spec)).toEqual([]);
    expect(spec.id).toBe(id);
    expect(spec.name).not.toMatch(/[()[\]]/);
    expect(spec.name).not.toMatch(/\s/);
    expect(spec.source.url).toMatch(/^https:\/\//);
    expect(spec.source.license).not.toBe("");
  });

  test.each(IDS)("%s scopes its settings and extras under its data-skin", async (id) => {
    const { spec, extras } = await load(id);
    const css = skinCss(spec, extras, "../fonts/");
    const scope = `[data-skin="${id}"]`;
    expect(css).toContain("@layer t.skin");
    const settings = Object.entries(spec.settings);
    expect(settings.length).toBeGreaterThan(0);
    const [key, value] = settings[0] ?? ["", ""];
    const settingsBlock = css.indexOf(
      `${scope} {\n    ${SKIN_SETTINGS[key as keyof typeof SKIN_SETTINGS]}: ${value};`,
    );
    expect(settingsBlock).toBeGreaterThan(-1);
    const extrasBlock = css.indexOf(`${scope} {\n${extras}`);
    expect(extrasBlock).toBeGreaterThan(settingsBlock);
    expect(css.split(scope).length - 1).toBe(2);
  });
});

/** Builds dist/: the stylesheets, the HTML kit scripts, the manifest and the showcase site. */
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { Glob } from "bun";
import { PACKS } from "../../core/src/packs";
import { type PaletteSpec, paletteCss } from "../../core/src/palette";
import { type SkinSpec, skinCss } from "../../core/src/skins";
import { buildShowcase } from "./build-showcase";
import { gen } from "./gen";
import { at, ROOT } from "./paths";

const scan = async (pattern: string): Promise<string[]> =>
  (await Array.fromAsync(new Glob(pattern).scan(ROOT))).sort();
const read = (path: string): Promise<string> => Bun.file(at(path)).text();

async function out(path: string, content: string): Promise<void> {
  await mkdir(dirname(at(path)), { recursive: true });
  await Bun.write(at(path), content);
}

/** Removes comments and needless white space. Nothing else: the stylesheets go out as written. */
export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

const BASE_FILES = ["layers", "tokens", "base", "control", "popup"] as const;

export async function loadSkins(): Promise<{ spec: SkinSpec; extras: string }[]> {
  const skins: { spec: SkinSpec; extras: string }[] = [];
  for (const file of await scan("core/skins/*/skin.json")) {
    const spec = (await Bun.file(at(file)).json()) as SkinSpec;
    const extrasFile = Bun.file(at(dirname(file), "extras.css"));
    skins.push({ spec, extras: (await extrasFile.exists()) ? await extrasFile.text() : "" });
  }
  return skins;
}

export async function loadPalettes(): Promise<PaletteSpec[]> {
  const palettes: PaletteSpec[] = [];
  for (const file of await scan("core/palettes/src/*.json")) {
    if (file.endsWith("palette.schema.json")) continue;
    palettes.push((await Bun.file(at(file)).json()) as PaletteSpec);
  }
  return palettes;
}

async function buildCss(): Promise<void> {
  for (const pack of PACKS) {
    const files = await scan(`core/packs/${pack.id}/*/*.css`);
    if (files.length === 0 && pack.id !== "core") continue;
    const layer = pack.shell ? "t.shell" : "t.components";
    let css = "";
    if (pack.id === "core") for (const name of BASE_FILES) css += await read(`core/css/${name}.css`);
    else css += await read("core/css/layers.css");
    css += `@layer ${layer} {\n${(await Promise.all(files.map(read))).join("\n")}\n}\n`;
    await out(`dist/css/${pack.id === "core" ? "tailor" : `tailor-${pack.id}`}.css`, minifyCss(css));
  }
  const layers = await read("core/css/layers.css");
  for (const { spec, extras } of await loadSkins()) {
    await out(`dist/css/skins/${spec.id}.css`, minifyCss(layers + skinCss(spec, extras, "../fonts/")));
    for (const font of await scan(`core/skins/${spec.id}/fonts/*`)) {
      await out(`dist/css/fonts/${spec.id}/${font.split("/").pop()}`, "");
      await cp(at(font), at(`dist/css/fonts/${spec.id}/${font.split("/").pop()}`));
    }
  }
  for (const palette of await loadPalettes()) {
    await out(`dist/css/palettes/${palette.id}.css`, minifyCss(layers + paletteCss(palette)));
  }
}

async function buildHtmlKit(): Promise<void> {
  for (const pack of PACKS) {
    const entry = at(`html/src/${pack.id}/index.gen.ts`);
    if (!(await Bun.file(entry).exists())) continue;
    const result = await Bun.build({ entrypoints: [entry], format: "iife", target: "browser", minify: true });
    if (!result.success) throw new AggregateError(result.logs, `HTML kit: the pack ${pack.id} did not build`);
    const output = result.outputs[0];
    if (!output) throw new Error(`HTML kit: the pack ${pack.id} gave no output`);
    await out(`dist/html/${pack.id === "core" ? "tailor" : `tailor-${pack.id}`}.js`, await output.text());
  }
}

export async function build(): Promise<void> {
  const started = performance.now();
  const { specs, errors } = await gen();
  if (errors.length > 0) throw new Error(`The components are not complete:\n${errors.join("\n")}`);
  await rm(at("dist"), { recursive: true, force: true });
  await Promise.all([buildCss(), buildHtmlKit()]);

  const version = ((await Bun.file(at("package.json")).json()) as { version: string }).version;
  const skins = await loadSkins();
  const palettes = await loadPalettes();
  await out(
    "dist/manifest.json",
    `${JSON.stringify(
      {
        version,
        skins: skins.map(({ spec }) => ({ id: spec.id, name: spec.name, about: spec.about })),
        palettes: palettes.map((p) => ({ id: p.id, name: p.name, license: p.license, docs: p.docs })),
        packs: PACKS,
        components: specs,
      },
      null,
      2,
    )}\n`,
  );
  await buildShowcase(
    specs,
    skins.map((s) => s.spec),
    palettes,
  );
  console.log(
    `build: ${specs.length} components, ${skins.length} skins, ${palettes.length} palettes in ${Math.round(performance.now() - started)} ms`,
  );
}

if (import.meta.main) await build();

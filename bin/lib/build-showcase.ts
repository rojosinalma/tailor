/** Builds the showcase site into showcase/dist: the app, one page per component for each kit, and the assets. */
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { Glob } from "bun";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PaletteSpec } from "../../core/src/palette";
import type { SkinSpec } from "../../core/src/skins";
import type { ComponentSpec } from "../../core/src/spec";
import { buildSprite, findIconNames, ICON_SETS, type IconData } from "../../core/src/sprite";
import { prepaintScript, type ThemeConfig } from "../../core/src/theme";
import type { ExampleSet } from "../../react/src/examples";
import { at, ROOT } from "./paths";

const scan = async (pattern: string): Promise<string[]> =>
  (await Array.fromAsync(new Glob(pattern).scan(ROOT))).sort();

async function out(path: string, content: string): Promise<void> {
  await mkdir(dirname(at(path)), { recursive: true });
  await Bun.write(at(path), content);
}

const minify = (css: string): string =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};])\s*/g, "$1")
    .trim();

export const DEFAULT_SKIN = "bootstrap";
export const DEFAULT_PALETTE = "gruvbox";

export function showcaseTheme(skins: readonly SkinSpec[], palettes: readonly PaletteSpec[]): ThemeConfig {
  return {
    key: "tailor",
    skins: skins.map((s) => s.id),
    palettes: palettes.map((p) => p.id),
    defaults: { skin: DEFAULT_SKIN, palette: DEFAULT_PALETTE, mode: "auto" },
    labels: Object.fromEntries([...skins, ...palettes].map((x) => [x.id, x.name])),
  };
}

function page(options: {
  title: string;
  rel: string;
  theme: ThemeConfig;
  body: string;
  scripts: string[];
  bodyClass: string;
}): string {
  const { title, rel, theme, body, scripts, bodyClass } = options;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<script>${prepaintScript(theme)}</script>
<link rel="stylesheet" href="${rel}assets/all.css">
<link rel="stylesheet" href="${rel}assets/showcase.css">
</head>
<body class="${bodyClass}">
${body}
${scripts.map((src) => `<script${src.endsWith(".js") && src.includes("assets/") ? ' type="module"' : ""} src="${rel}${src}"></script>`).join("\n")}
</body>
</html>
`;
}

export async function buildShowcase(
  specs: readonly ComponentSpec[],
  skins: readonly SkinSpec[],
  palettes: readonly PaletteSpec[],
): Promise<void> {
  const dist = "showcase/dist";
  await rm(at(dist), { recursive: true, force: true });
  const theme = showcaseTheme(skins, palettes);

  const site = `${JSON.stringify({ theme, components: specs.map(({ id, name, pack, group, description, html }) => ({ id, name, pack, group, description, html })) }, null, 2)}\n`;
  const siteFile = Bun.file(at("showcase/src/site.gen.json"));
  if (!(await siteFile.exists()) || (await siteFile.text()) !== site) await Bun.write(siteFile, site);

  // The app and the React entry page.
  const entrypoints = [at("showcase/src/entry.tsx")];
  if (await Bun.file(at("showcase/src/main.tsx")).exists()) entrypoints.push(at("showcase/src/main.tsx"));
  const bundle = await Bun.build({
    entrypoints,
    outdir: at(dist, "assets"),
    target: "browser",
    format: "esm",
    splitting: true,
    minify: true,
    naming: { entry: "[name].js", chunk: "chunk-[hash].js" },
    define: { "process.env.NODE_ENV": '"production"' },
  });
  if (!bundle.success) throw new AggregateError(bundle.logs, "The showcase did not build");

  // The tailor files, as a project gets them, and one stylesheet with every skin and palette for the showcase.
  await cp(at("dist/css"), at(dist, "tailor"), { recursive: true });
  await cp(at("dist/html"), at(dist, "tailor"), { recursive: true });
  const cssFiles = [
    ...(await scan("dist/css/tailor.css")),
    ...(await scan("dist/css/tailor-*.css")),
    ...(await scan("dist/css/skins/*.css")),
    ...(await scan("dist/css/palettes/*.css")),
  ];
  const all = (await Promise.all(cssFiles.map((f) => Bun.file(at(f)).text()))).join("\n");
  await out(`${dist}/assets/all.css`, all.replaceAll("../fonts/", "../tailor/fonts/"));
  const showcaseCss = await Promise.all(
    (await scan("showcase/src/**/*.css")).map((f) => Bun.file(at(f)).text()),
  );
  await out(`${dist}/assets/showcase.css`, minify(showcaseCss.join("\n")));

  // The icon sprite: every icon that the kit sources and the showcase name.
  const sources = [...(await scan("react/src/**/*.tsx")), ...(await scan("showcase/src/**/*.tsx"))];
  const names = (await Promise.all(sources.map((f) => Bun.file(at(f)).text()))).flatMap(findIconNames);
  const sets: Record<string, IconData> = {};
  for (const set of ICON_SETS)
    sets[set] = (await Bun.file(at(`node_modules/@iconify-json/${set}/icons.json`)).json()) as IconData;
  const { sprite, missing } = buildSprite(names, sets);
  if (missing.length > 0) throw new Error(`Unknown icons: ${missing.join(", ")}`);
  await out(`${dist}/tailor/icons.svg`, sprite);

  // React kit: one entry page that renders the examples of the component named in the address.
  await out(
    `${dist}/entry.html`,
    page({
      title: "tailor",
      rel: "",
      theme,
      body: '<div id="root"></div>',
      scripts: ["assets/entry.js"],
      bodyClass: "sc-entry",
    }),
  );

  // HTML kit: one static page per component, rendered from the same examples in static mode.
  const { StaticKit } = await import(at("react/src/kit.tsx"));
  const { EntrySections } = await import(at("showcase/src/entry-sections.tsx"));
  const { IconSprite } = await import(at("react/src/core/icon/icon.tsx"));
  const htmlScripts = (await scan("dist/html/*.js"))
    .map((f) => `tailor/${f.split("/").pop()}`)
    .sort((a, b) => (a === "tailor/tailor.js" ? -1 : b === "tailor/tailor.js" ? 1 : a.localeCompare(b)));
  for (const spec of specs) {
    if (spec.html === "none") continue;
    const set = (
      (await import(at(`react/src/${spec.pack}/${spec.id}/examples.tsx`))) as { default: ExampleSet }
    ).default;
    const body = renderToStaticMarkup(
      createElement(
        StaticKit,
        null,
        createElement(IconSprite, { href: "../tailor/icons.svg" }, createElement(EntrySections, { set })),
      ),
    );
    await out(
      `${dist}/html/${spec.id}.html`,
      page({
        title: `${spec.name} · tailor`,
        rel: "../",
        theme,
        body,
        scripts: htmlScripts,
        bodyClass: "sc-entry",
      }),
    );
  }
}

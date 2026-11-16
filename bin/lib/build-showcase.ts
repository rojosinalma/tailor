/** Builds the showcase site into showcase/dist: the app, one page per component for each kit, and the assets. */
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { Glob } from "bun";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { withRequirements } from "../../core/src/packs";
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

/** One static page of the showcase site for the HTML kit: its address under the site root and its content. */
export interface StaticPage {
  readonly path: string;
  readonly title: string;
  readonly render: () => ReactNode;
}

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
<script>${prepaintScript(theme)}window.TAILOR_THEME=${JSON.stringify(theme).replaceAll("<", "\\u003c")};</script>
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
  // The entry page of the checks, the showcase app, and every other page of the site (showcase/src/pages/<name>.tsx).
  const entrypoints = [at("showcase/src/entry.tsx")];
  const hasApp = await Bun.file(at("showcase/src/main.tsx")).exists();
  if (hasApp) entrypoints.push(at("showcase/src/main.tsx"));
  const sitePages = (await scan("showcase/src/pages/*.tsx")).map(
    (f) =>
      f
        .split("/")
        .pop()
        ?.replace(/\.tsx$/, "") ?? "",
  );
  for (const name of sitePages) entrypoints.push(at(`showcase/src/pages/${name}.tsx`));
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

  if (hasApp) {
    await out(
      `${dist}/index.html`,
      page({
        title: "tailor",
        rel: "",
        theme,
        body: '<div id="root"></div>',
        scripts: ["assets/main.js"],
        bodyClass: "sc-app",
      }),
    );
  }
  for (const name of sitePages) {
    await out(
      `${dist}/${name}.html`,
      page({
        title: "tailor",
        rel: "",
        theme,
        body: '<div id="root"></div>',
        scripts: [`assets/${name}.js`],
        bodyClass: "sc-page",
      }),
    );
  }

  // HTML kit: one static page per component, rendered from the same examples in static mode.
  const { StaticKit } = await import(at("react/src/kit.tsx"));
  const { EntrySections } = await import(at("showcase/src/entry-sections.tsx"));
  const { IconSprite } = await import(at("react/src/core/icon/icon.tsx"));
  // A page loads the scripts of its own pack, of the packs that one requires, and of any pack whose
  // component an example uses (the markup names it in data-t), as a project would.
  const built = new Set((await scan("dist/html/*.js")).map((f) => f.split("/").pop()));
  const scriptsFor = (pack: string, body: string): string[] => {
    const used = new Set([...body.matchAll(/data-t="([^"]+)"/g)].flatMap((m) => (m[1] ?? "").split(/\s+/)));
    const packs = specs.filter((s) => s.html === "script" && used.has(s.id)).map((s) => s.pack);
    return withRequirements([pack, ...packs])
      .map((id) => (id === "core" ? "tailor.js" : `tailor-${id}.js`))
      .filter((file) => built.has(file))
      .map((file) => `tailor/${file}`);
  };
  for (const spec of specs) {
    if (spec.html === "none") continue;
    const set = (
      (await import(at(`react/src/${spec.pack}/${spec.id}/examples.tsx`))) as { default: ExampleSet }
    ).default;
    const body = renderToStaticMarkup(
      createElement(
        StaticKit,
        null,
        createElement(
          IconSprite,
          { href: "../tailor/icons.svg" },
          createElement(EntrySections, {
            // An example that only the React kit can show is not on the HTML kit's page.
            set: { ...set, examples: set.examples.filter((example) => example.kit !== "react") },
            title: spec.name,
          }),
        ),
      ),
    );
    // ?example=<id> keeps one example; ?embed=1 drops the page's own title and padding, for a view inside a frame.
    const filter =
      '<script>(function(){var q=new URLSearchParams(location.search),e=q.get("example");' +
      'if(e)document.querySelectorAll(".sc-example").forEach(function(s){if(s.dataset.example!==e)s.remove()});' +
      'if(q.get("embed"))document.body.classList.add("sc-embed")})()</script>';

    await out(
      `${dist}/html/${spec.id}.html`,
      page({
        title: `${spec.name} · tailor`,
        rel: "../",
        theme,
        body: body + filter,
        scripts: scriptsFor(spec.pack, body),
        bodyClass: "sc-entry",
      }),
    );
  }

  // HTML kit: the site's own static pages (showcase/src/static-pages.tsx), such as a shell shown as a full UI
  // with several pages that link to each other.
  if (await Bun.file(at("showcase/src/static-pages.tsx")).exists()) {
    const { staticPages } = (await import(at("showcase/src/static-pages.tsx"))) as {
      staticPages: readonly StaticPage[];
    };
    for (const item of staticPages) {
      const depth = item.path.split("/").length - 1;
      const rel = "../".repeat(depth);
      const body = renderToStaticMarkup(
        createElement(
          StaticKit,
          null,
          createElement(IconSprite, { href: `${rel}tailor/icons.svg` }, item.render()),
        ),
      );
      await out(
        `${dist}/${item.path}`,
        page({
          title: `${item.title} · tailor`,
          rel,
          theme,
          body,
          scripts: scriptsFor("core", body),
          bodyClass: "sc-page",
        }),
      );
    }
  }
}

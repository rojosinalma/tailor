/** Builds the showcase site into showcase/dist: the app, one page per component for each kit, and the assets. */
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Glob } from "bun";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { appIcon, buildManifest } from "../../core/packs/pwa/pwa/logic";
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

/** A built script and every file that it imports statically, directly or through another one, in the folder. */
async function staticImports(folder: string, entry: string): Promise<string[]> {
  const transpiler = new Bun.Transpiler({ loader: "js" });
  const found = new Set<string>();
  const visit = async (file: string): Promise<void> => {
    if (found.has(file)) return;
    found.add(file);
    const { imports } = transpiler.scan(await Bun.file(join(folder, file)).text());
    for (const { path, kind } of imports)
      if (kind === "import-statement" && path.startsWith("./")) await visit(path.slice(2));
  };
  await visit(entry);
  return [...found];
}

/** One static page of the showcase site for the HTML kit: its address under the site root and its content. */
export interface StaticPage {
  readonly path: string;
  readonly title: string;
  readonly render: () => ReactNode;
}

const PWA_HEAD =
  '\n<link rel="manifest" href="manifest.webmanifest" crossorigin="use-credentials">\n<link rel="icon" href="icon.svg" type="image/svg+xml">';

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
  head?: string;
}): string {
  const { title, rel, theme, body, scripts, bodyClass, head = "" } = options;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<script>${prepaintScript(theme)}window.TAILOR_THEME=${JSON.stringify(theme).replaceAll("<", "\\u003c")};</script>
<link rel="stylesheet" href="${rel}assets/all.css">
<link rel="stylesheet" href="${rel}assets/showcase.css">${head}
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
        head: PWA_HEAD,
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
  // The pack of each behaviour, from the names that the HTML kit's scripts register.
  const behaviourPack = new Map<string, string>();
  for (const file of await scan("html/src/*/*.ts")) {
    const pack = file.split("/")[2] ?? "";
    for (const match of (await Bun.file(at(file)).text()).matchAll(/register\(\s*"([^"]+)"/g)) {
      if (match[1]) behaviourPack.set(match[1], pack);
    }
  }
  const scriptsFor = (pack: string, body: string): string[] => {
    const used = new Set([...body.matchAll(/data-t="([^"]+)"/g)].flatMap((m) => (m[1] ?? "").split(/\s+/)));
    const packs = [...used].map((name) => behaviourPack.get(name)).filter((id) => id !== undefined);
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

  // The site as an installable app that opens with no network: the pwa pack, used on itself.
  if (hasApp) {
    const gruvbox = palettes.find((p) => p.id === DEFAULT_PALETTE);
    const glyph = sets.bi?.icons.scissors?.body ?? "";
    const colours = { canvas: gruvbox?.canvas ?? "#282828", accent: gruvbox?.accent ?? "#fabd2f" };
    await out(`${dist}/icon.svg`, appIcon({ glyph, ...colours }));
    await out(`${dist}/icon-maskable.svg`, appIcon({ glyph, ...colours, maskable: true }));
    await out(
      `${dist}/manifest.webmanifest`,
      `${JSON.stringify(
        buildManifest({
          name: "tailor",
          description: "Every shell and component of tailor, in every skin and palette.",
          start: "./",
          scope: "./",
          icons: [
            { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
            { src: "icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
          ],
          themeColor: colours.canvas,
          backgroundColor: colours.canvas,
        }),
        null,
        2,
      )}\n`,
    );
    const { OfflinePage } = await import(at("react/src/core/offline-page/offline-page.tsx"));
    const offline = renderToStaticMarkup(createElement(StaticKit, null, createElement(OfflinePage)));
    await out(
      `${dist}/offline.html`,
      page({
        title: "tailor",
        rel: "",
        theme,
        body: offline,
        scripts: ["tailor/tailor.js"],
        bodyClass: "sc-page",
      }),
    );
    // A new version for every build whose files differ, so an installed copy learns of the update.
    // The shell is what the overview needs to open with no network: the app script and the chunks that it
    // imports statically. A component page's examples load lazily and are cached at the first online visit.
    const shell = [
      "./",
      "index.html",
      "assets/all.css",
      "assets/showcase.css",
      ...(await staticImports(at(dist, "assets"), "main.js")).map((file) => `assets/${file}`),
      "tailor/icons.svg",
    ];
    const hasher = new Bun.CryptoHasher("sha256");
    for (const file of shell.slice(1)) hasher.update(await Bun.file(at(dist, file)).bytes());
    await out(
      `${dist}/sw.js`,
      `importScripts("tailor/tailor-sw.js");\ntailorServiceWorker(${JSON.stringify({ version: hasher.digest("hex").slice(0, 12), shell, offline: "offline.html", spa: true })});\n`,
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

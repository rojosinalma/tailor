/** The weight limits. What a page of the HTML kit loads for the core pack must stay under 50 kB compressed. */
import { Glob } from "bun";
import { DEFAULT_PALETTE, DEFAULT_SKIN } from "../../bin/lib/build-showcase";
import { at, ROOT } from "../../bin/lib/paths";

export const HTML_CORE_LIMIT = 50_000;
/**
 * The React core limit: every component of the core pack with React, Base UI and the router, minified and
 * compressed. A project ships less, because its bundler drops what it does not import.
 * Set at the first measured build (147.6 kB) plus 10 %.
 */
export const REACT_CORE_LIMIT = 162_500;

export async function measureReactCore(): Promise<number> {
  const result = await Bun.build({
    entrypoints: [at("react/src/core/index.gen.ts")],
    target: "browser",
    format: "esm",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const output = result.outputs[0];
  if (!result.success || !output) throw new AggregateError(result.logs, "The React core did not build");
  return Bun.gzipSync(Buffer.from(await output.text()), { level: 9 }).length;
}

const gzip = async (path: string): Promise<number> =>
  Bun.gzipSync(await Bun.file(at(path)).bytes(), { level: 9 }).length;

export async function measureWeight(): Promise<{
  htmlCore: number;
  parts: Record<string, number>;
  packs: Record<string, number>;
}> {
  const parts: Record<string, number> = {};
  for (const file of [
    "dist/css/tailor.css",
    `dist/css/skins/${DEFAULT_SKIN}.css`,
    `dist/css/palettes/${DEFAULT_PALETTE}.css`,
    "dist/html/tailor.js",
  ]) {
    if (await Bun.file(at(file)).exists()) parts[file] = await gzip(file);
  }
  const packs: Record<string, number> = {};
  for (const pattern of ["dist/css/tailor-*.css", "dist/html/tailor-*.js"]) {
    for (const file of (await Array.fromAsync(new Glob(pattern).scan(ROOT))).sort())
      packs[file] = await gzip(file);
  }
  return { htmlCore: Object.values(parts).reduce((a, b) => a + b, 0), parts, packs };
}

export async function checkWeight(): Promise<boolean> {
  const { htmlCore, parts } = await measureWeight();
  const kb = (n: number): string => `${(n / 1000).toFixed(1)} kB`;
  console.log(
    `    HTML core: ${kb(htmlCore)} of ${kb(HTML_CORE_LIMIT)} (${Object.entries(parts)
      .map(([f, n]) => `${f.split("/").pop()} ${kb(n)}`)
      .join(", ")})`,
  );
  const reactCore = await measureReactCore();
  console.log(`    React core: ${kb(reactCore)} of ${kb(REACT_CORE_LIMIT)}`);
  return htmlCore <= HTML_CORE_LIMIT && reactCore <= REACT_CORE_LIMIT;
}

if (import.meta.main) {
  const { htmlCore, parts, packs } = await measureWeight();
  for (const [file, size] of Object.entries({ ...parts, ...packs }))
    console.log(`${String(size).padStart(8)}  ${file}`);
  console.log(`${String(htmlCore).padStart(8)}  HTML core total (limit ${HTML_CORE_LIMIT})`);
  const reactCore = await measureReactCore();
  console.log(`${String(reactCore).padStart(8)}  React core total (limit ${REACT_CORE_LIMIT})`);
  process.exit(htmlCore <= HTML_CORE_LIMIT && reactCore <= REACT_CORE_LIMIT ? 0 : 1);
}

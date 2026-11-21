/** Runs the page checks for the named components (or for all): sideways scroll, cut text, overlap, touch size, accessibility. */
import { loadPalettes, loadSkins } from "../../bin/lib/build";
import { DEFAULT_PALETTE, DEFAULT_SKIN } from "../../bin/lib/build-showcase";
import { gen } from "../../bin/lib/gen";
import { serve } from "../../bin/lib/serve";
import { appChecks } from "./apps";
import { runPages } from "./pages";
import { printProblems } from "./report";

if (import.meta.main) {
  const args = process.argv.slice(2);
  // --skin=<id> (repeatable) checks only those skins.
  const skinArgs = args.filter((a) => a.startsWith("--skin=")).map((a) => a.slice("--skin=".length));
  const names = args.filter((a) => !a.startsWith("--"));
  const { specs } = await gen();
  const skins = (await loadSkins()).map((s) => s.spec.id);
  const palettes = (await loadPalettes()).map((p) => p.id);
  const site = serve();
  const started = performance.now();
  const result = await runPages({
    siteUrl: site.url,
    // --apps checks the sample apps only.
    specs: args.includes("--apps") ? [] : specs,
    skins,
    palettes,
    defaultSkin: DEFAULT_SKIN,
    defaultPalette: DEFAULT_PALETTE,
    ...(names.length > 0 ? { only: new Set(names) } : { apps: appChecks(specs, "full") }),
    ...(skinArgs.length > 0 ? { onlySkins: new Set(skinArgs) } : {}),
    images: args.includes("--images"),
    update: args.includes("--update-images"),
    sweep: args.includes("--sweep"),
    axe: !args.includes("--no-axe"),
  });
  site.stop();
  printProblems(result.problems);
  console.log(
    `pages: ${result.pages} pages, ${result.states} states, ${result.problems.length} problems, ${Math.round(performance.now() - started)} ms`,
  );
  if (result.problems.length > 0) process.exit(1);
}

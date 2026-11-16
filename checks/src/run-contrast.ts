/**
 * Runs the contrast check: text contrast in every palette and mode.
 *   bun checks/src/run-contrast.ts [ids…] [--skin=<id>…] [--all]
 * With no ids it checks the components that show the most colour; --all checks every component.
 */
import { loadPalettes, loadSkins } from "../../bin/lib/build";
import { gen } from "../../bin/lib/gen";
import { serve } from "../../bin/lib/serve";
import { runContrast } from "./contrast";
import { printProblems } from "./report";

const args = process.argv.slice(2);
const names = args.filter((a) => !a.startsWith("--"));
const skinArgs = args.filter((a) => a.startsWith("--skin=")).map((a) => a.slice("--skin=".length));
const { specs } = await gen();
const skins = (await loadSkins())
  .map((s) => s.spec.id)
  .filter((id) => skinArgs.length === 0 || skinArgs.includes(id));
const palettes = (await loadPalettes()).map((p) => p.id);
const site = serve();
const started = performance.now();
const result = await runContrast({
  siteUrl: site.url,
  specs,
  skins,
  palettes,
  all: args.includes("--all"),
  ...(names.length > 0 ? { only: new Set(names) } : {}),
});
site.stop();
printProblems(result.problems);
console.log(
  `contrast: ${result.states} combinations, ${result.problems.length} problems, ${Math.round(performance.now() - started)} ms`,
);
if (result.problems.length > 0) process.exit(1);

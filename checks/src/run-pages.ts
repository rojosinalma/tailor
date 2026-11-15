/** Runs the page checks for the named components (or for all): sideways scroll, cut text, overlap, touch size, accessibility. */
import { loadPalettes, loadSkins } from "../../bin/lib/build";
import { DEFAULT_PALETTE, DEFAULT_SKIN } from "../../bin/lib/build-showcase";
import { gen } from "../../bin/lib/gen";
import { serve } from "../../bin/lib/serve";
import { type PageProblem, runPages } from "./pages";

export function printProblems(problems: readonly PageProblem[]): void {
  const seen = new Map<string, { problem: PageProblem; states: string[] }>();
  for (const problem of problems) {
    const key = `${problem.page}|${problem.rule}|${problem.message}`;
    const entry = seen.get(key) ?? { problem, states: [] };
    entry.states.push(problem.state);
    seen.set(key, entry);
  }
  for (const { problem, states } of seen.values()) {
    const where =
      states.length > 3
        ? `${states.slice(0, 3).join(", ")} and ${states.length - 3} more`
        : states.join(", ");
    console.error(`FAIL ${problem.page} [${problem.rule}] ${problem.message}\n     at: ${where}`);
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const names = args.filter((a) => !a.startsWith("--"));
  const { specs } = await gen();
  const skins = (await loadSkins()).map((s) => s.spec.id);
  const palettes = (await loadPalettes()).map((p) => p.id);
  const site = serve();
  const started = performance.now();
  const result = await runPages({
    siteUrl: site.url,
    specs,
    skins,
    palettes,
    defaultSkin: DEFAULT_SKIN,
    defaultPalette: DEFAULT_PALETTE,
    ...(names.length > 0 ? { only: new Set(names) } : {}),
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

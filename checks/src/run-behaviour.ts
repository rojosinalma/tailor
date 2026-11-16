/** Runs the behaviour tests of the named components (or of all) against every kit that has the component. */
import { Glob } from "bun";
import { at, ROOT } from "../../bin/lib/paths";
import type { ComponentSpec } from "../../core/src/spec";
import { type BehaviourSuite, expect, type Kit } from "./behaviour";
import { connectBrowser, FIXED_NOW, pool, WORKERS } from "./browser";

export interface BehaviourFailure {
  readonly component: string;
  readonly kit: Kit;
  readonly test: string;
  readonly error: string;
}

export async function runBehaviour(
  siteUrl: string,
  specs: readonly ComponentSpec[],
  only?: ReadonlySet<string>,
): Promise<{ ran: number; failures: BehaviourFailure[]; untested: string[] }> {
  const files = (await Array.fromAsync(new Glob("checks/behaviour/*/*.ts").scan(ROOT))).sort();
  const suites: BehaviourSuite[] = [];
  for (const file of files) suites.push(((await import(at(file))) as { default: BehaviourSuite }).default);

  const jobs: { suite: BehaviourSuite; kit: Kit; name: string }[] = [];
  for (const suite of suites) {
    if (only && !only.has(suite.component)) continue;
    const spec = specs.find((s) => s.id === suite.component);
    if (!spec) throw new Error(`checks/behaviour: no component named "${suite.component}"`);
    const kits: Kit[] = spec.html === "none" ? ["react"] : ["react", "html"];
    for (const kit of kits) for (const name of Object.keys(suite.tests)) jobs.push({ suite, kit, name });
  }
  // A component with a script in the HTML kit has behaviour, so it needs tests.
  const tested = new Set(suites.map((s) => s.component));
  const untested = specs.filter((s) => s.html === "script" && !tested.has(s.id)).map((s) => s.id);
  if (jobs.length === 0) return { ran: 0, failures: [], untested };

  const browser = await connectBrowser();
  try {
    const runJob = async ({ suite, kit, name }: (typeof jobs)[number]): Promise<BehaviourFailure | null> => {
      const context = await browser.newContext({
        viewport: suite.viewport ?? { width: 1280, height: 800 },
        reducedMotion: "reduce",
        colorScheme: "dark",
        locale: "en-US",
        timezoneId: "UTC",
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      try {
        const url = kit === "react" ? `entry.html?id=${suite.component}` : `html/${suite.component}.html`;
        await page.goto(siteUrl + url);
        await page.locator(".sc-example").first().waitFor();
        const test = suite.tests[name];
        if (!test) throw new Error("no such test");
        await test({
          page,
          kit,
          expect,
          example: (id) => page.locator(`.sc-example[data-example="${id}"] .sc-example-body`),
          freezeTime: async () => {
            await page.clock.setFixedTime(FIXED_NOW);
            await page.reload();
            await page.locator(".sc-example").first().waitFor();
          },
        });
        if (errors.length > 0) throw new Error(`page errors: ${errors.join("; ")}`);
        return null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          component: suite.component,
          kit,
          test: name,
          error: message.split("\n").slice(0, 12).join("\n"),
        };
      } finally {
        await context.close();
      }
    };
    const results = await pool(jobs, WORKERS, runJob);
    // A test that failed runs once more, alone: with many pages open at once, a wait can run out of time.
    // A test that fails twice has a real fault.
    const failures: BehaviourFailure[] = [];
    for (const [index, result] of results.entries()) {
      const job = jobs[index];
      if (result === null || !job) continue;
      const again = await runJob(job);
      if (again !== null) failures.push(again);
    }
    return { ran: jobs.length, failures, untested };
  } finally {
    await browser.close();
  }
}

if (import.meta.main) {
  const { gen } = await import("../../bin/lib/gen");
  const { serve } = await import("../../bin/lib/serve");
  const { specs } = await gen();
  const site = serve();
  const names = process.argv.slice(2);
  const started = performance.now();
  const { ran, failures, untested } = await runBehaviour(
    site.url,
    specs,
    names.length ? new Set(names) : undefined,
  );
  site.stop();
  for (const f of failures)
    console.error(`FAIL ${f.component} [${f.kit}] ${f.test}\n  ${f.error.replaceAll("\n", "\n  ")}\n`);
  for (const id of untested)
    console.error(`FAIL ${id}: a component with an HTML kit script needs checks/behaviour/<pack>/${id}.ts`);
  console.log(
    `behaviour: ${ran} tests, ${failures.length} failed, ${Math.round(performance.now() - started)} ms`,
  );
  if (failures.length > 0 || (untested.length > 0 && names.length === 0)) process.exit(1);
}

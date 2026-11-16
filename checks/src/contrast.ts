/**
 * The contrast check: text contrast (WCAG 2.2 AA) in every combination of skin, palette and mode.
 * A release checks the components that show the most colour; a full run checks every component.
 */
import { at } from "../../bin/lib/paths";
import type { ComponentSpec } from "../../core/src/spec";
import { connectBrowser, FIXED_NOW, pool, WORKERS } from "./browser";
import { COLOURFUL } from "./colourful";
import type { PageProblem } from "./pages";

const AXE_SOURCE = at("node_modules/axe-core/axe.min.js");

/** The part of the accessibility engine that the check calls in the page. */
interface AxeRunner {
  run(
    context: Document,
    options: { runOnly: string[]; resultTypes: string[] },
  ): Promise<{ violations: { nodes: { target: string[]; any: { message: string }[] }[] }[] }>;
}

export interface ContrastOptions {
  readonly siteUrl: string;
  readonly specs: readonly ComponentSpec[];
  readonly skins: readonly string[];
  readonly palettes: readonly string[];
  /** Every component instead of the colourful ones. */
  readonly all?: boolean;
  readonly only?: ReadonlySet<string>;
}

export async function runContrast(
  options: ContrastOptions,
): Promise<{ states: number; problems: PageProblem[] }> {
  const ids = options.specs
    .map((s) => s.id)
    .filter((id) => (options.only ? options.only.has(id) : options.all || COLOURFUL.includes(id)));
  const skins = options.skins.length > 0 ? options.skins : [""];
  const problems: PageProblem[] = [];
  let states = 0;
  const browser = await connectBrowser();
  try {
    await pool(ids, WORKERS, async (id) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        reducedMotion: "reduce",
        locale: "en-US",
        timezoneId: "UTC",
      });
      const page = await context.newPage();
      try {
        await page.clock.setFixedTime(FIXED_NOW);
        await page.goto(`${options.siteUrl}entry.html?id=${id}`);
        await page.locator(".sc-example").first().waitFor();
        // The accessibility engine is put into the page once and run again for every combination.
        await page.addScriptTag({ path: AXE_SOURCE });
        for (const skin of skins) {
          for (const palette of options.palettes) {
            for (const mode of ["dark", "light"] as const) {
              states++;
              await page.evaluate(
                async ([s, p, m]) => {
                  const root = document.documentElement;
                  root.dataset.skin = s;
                  root.dataset.palette = p;
                  root.dataset.mode = m;
                  await new Promise((done) => requestAnimationFrame(() => done(null)));
                },
                [skin, palette, mode] as const,
              );
              const failing = await page.evaluate(async () => {
                const axe = (window as unknown as { axe: AxeRunner }).axe;
                const result = await axe.run(document, {
                  runOnly: ["color-contrast"],
                  resultTypes: ["violations"],
                });
                return result.violations.flatMap((v) =>
                  v.nodes.map((node) => ({
                    target: node.target.join(" "),
                    detail: node.any[0]?.message ?? "",
                  })),
                );
              });
              for (const node of failing) {
                const ratio = /contrast of ([\d.]+)/.exec(node.detail)?.[1] ?? "?";
                problems.push({
                  page: `react/${id}`,
                  state: `${skin || "no skin"} ${palette} ${mode}`,
                  rule: "contrast",
                  message: `${node.target} has a contrast of ${ratio}`,
                });
              }
            }
          }
        }
      } catch (error) {
        problems.push({
          page: `react/${id}`,
          state: "load",
          rule: "page-error",
          message: error instanceof Error ? (error.message.split("\n")[0] ?? "") : String(error),
        });
      } finally {
        await context.close();
      }
    });
  } finally {
    await browser.close();
  }
  return { states, problems };
}

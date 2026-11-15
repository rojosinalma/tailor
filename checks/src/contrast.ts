/**
 * The contrast check: text contrast (WCAG 2.2 AA) in every combination of skin, palette and mode.
 * A release checks the components that show the most colour; a full run checks every component.
 */
import { AxeBuilder } from "@axe-core/playwright";
import type { ComponentSpec } from "../../core/src/spec";
import { connectBrowser, pool, WORKERS } from "./browser";
import type { PageProblem } from "./pages";

/** The components a release checks in all 252 combinations. */
const COLOURFUL = [
  "alert",
  "badge",
  "banner",
  "button",
  "card",
  "chip",
  "counter",
  "date",
  "field",
  "input",
  "list",
  "menu",
  "pagination",
  "segmented",
  "select",
  "sidenav",
  "stat",
  "state-label",
  "stepper",
  "table",
  "tabs",
  "topnav",
];

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
        await page.clock.setFixedTime(new Date("2026-11-15T12:00:00Z"));
        await page.goto(`${options.siteUrl}entry.html?id=${id}`);
        await page.locator(".sc-example").first().waitFor();
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
              const { violations } = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
              for (const node of violations.flatMap((v) => v.nodes)) {
                const detail = node.any[0]?.message ?? "";
                const ratio = /contrast of ([\d.]+)/.exec(detail)?.[1] ?? "?";
                problems.push({
                  page: `react/${id}`,
                  state: `${skin || "no skin"} ${palette} ${mode}`,
                  rule: "contrast",
                  message: `${node.target.join(" ")} has a contrast of ${ratio}`,
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

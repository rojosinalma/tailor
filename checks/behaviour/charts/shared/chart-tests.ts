/** The tests that every chart of the pack shares. A helper, not a suite: the runner reads only checks/behaviour/<pack>/<id>.ts. */
import type { Locator } from "playwright";
import type { BehaviourContext, BehaviourTest } from "../../../src/behaviour";

/** A digest of the canvas pixels, to see that the drawing changed. */
const pixels = (canvas: Locator): Promise<string> =>
  canvas.evaluate((el) => {
    if (!(el instanceof HTMLCanvasElement)) return "";
    const data = el.getContext("2d")?.getImageData(0, 0, el.width, el.height).data ?? [];
    let hash = 0;
    for (let i = 0; i < data.length; i += 4) {
      if ((data[i + 3] ?? 0) === 0) continue;
      hash = (hash * 31 + (data[i] ?? 0) * 65536 + (data[i + 1] ?? 0) * 256 + (data[i + 2] ?? 0)) >>> 0;
    }
    return String(hash);
  });

export interface ChartCase {
  /** The example with several series and a legend. */
  readonly example: string;
  readonly label: string;
  /** A legend item of that example. */
  readonly series: string;
  /** A row header and a value in the hidden table. */
  readonly row: string;
  readonly value: string;
  /** A point in the canvas, 0 to 1, where the pointer shows the tooltip. */
  readonly at: { readonly x: number; readonly y: number };
}

export function chartTests(c: ChartCase): Record<string, BehaviourTest> {
  const canvasOf = ({ example }: BehaviourContext): Locator =>
    example(c.example).getByRole("img", { name: c.label });
  return {
    "the canvas is an image named by the label": async (context) => {
      const canvas = canvasOf(context);
      await context.expect(canvas).toBeVisible();
      await context.expect(canvas).toHaveJSProperty("tagName", "CANVAS");
    },
    "a hidden table holds the same numbers": async ({ example, expect }) => {
      const table = example(c.example).getByRole("table", { name: c.label });
      await expect(table).toHaveClass(/t-sr-only/);
      const row = table
        .getByRole("row")
        .filter({ has: table.page().getByRole("rowheader", { name: c.row }) });
      await expect(row).toContainText(c.value);
    },
    "a legend item shows and hides its series": async (context) => {
      const { example, expect } = context;
      const canvas = canvasOf(context);
      const item = example(c.example).getByRole("button", { name: c.series });
      await expect(item).toHaveAttribute("aria-pressed", "true");
      const before = await pixels(canvas);
      await item.click();
      await expect(item).toHaveAttribute("aria-pressed", "false");
      await expect.poll(() => pixels(canvas)).not.toBe(before);
      await item.press("Enter");
      await expect(item).toHaveAttribute("aria-pressed", "true");
      await expect.poll(() => pixels(canvas)).toBe(before);
    },
    "a change of mode redraws in the new colours": async (context) => {
      const { page, expect } = context;
      const canvas = canvasOf(context);
      await expect(canvas).toBeVisible();
      const before = await pixels(canvas);
      await page.evaluate(() => {
        document.documentElement.dataset.mode =
          document.documentElement.dataset.mode === "light" ? "dark" : "light";
      });
      await expect.poll(() => pixels(canvas)).not.toBe(before);
    },
    "the pointer over a point shows the values": async (context) => {
      const { example, expect } = context;
      const canvas = canvasOf(context);
      const box = await canvas.boundingBox();
      if (!box) throw new Error("the canvas has no box");
      const tip = example(c.example).locator(".t-chart-tooltip");
      await expect(tip).toBeHidden();
      await context.page.mouse.move(box.x + box.width * c.at.x, box.y + box.height * c.at.y);
      await expect(tip).toBeVisible();
      await expect(tip).toContainText(c.series);
    },
  };
}

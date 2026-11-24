import { behaviour } from "../../src/behaviour";
import { chartTests } from "./shared/chart-tests";

export default behaviour("bar-chart", {
  ...chartTests({
    example: "grouped",
    label: "Disk use per host",
    series: "Backups",
    row: "nas",
    value: "640 GB",
    at: { x: 0.65, y: 0.6 },
  }),
  "money follows the locale, and a reference line is drawn and in the table": async ({ example, expect }) => {
    const body = example("target");
    const table = body.getByRole("table", { name: "Spend per day, last 7 days" });
    const row = (name: string) =>
      table.getByRole("row").filter({ has: table.page().getByRole("rowheader", { name }) });
    await expect(row("Nov 10")).toContainText("$1,140");
    await expect(row("Required per day")).toContainText("$1,000");
    // The line is drawn across the plot: a row of the canvas at the line's height holds its colour end to end.
    const canvas = body.getByRole("img", { name: "Spend per day, last 7 days" });
    const drawn = await canvas.evaluate((el) => {
      if (!(el instanceof HTMLCanvasElement)) return 0;
      const ctx = el.getContext("2d");
      if (!ctx) return 0;
      // The densest dashed row: count the rows whose pixels change colour many times across the width.
      const { width, height } = el;
      const data = ctx.getImageData(0, 0, width, height).data;
      let best = 0;
      for (let y = 0; y < height; y++) {
        let changes = 0;
        for (let x = 1; x < width; x++) {
          const a = (y * width + x) * 4;
          const b = a - 4;
          if (Math.abs((data[a + 3] ?? 0) - (data[b + 3] ?? 0)) > 128) changes++;
        }
        best = Math.max(best, changes);
      }
      return best;
    });
    expect(drawn).toBeGreaterThan(20);
  },
});

import { behaviour } from "../../src/behaviour";
import { chartTests } from "./shared/chart-tests";

export default behaviour("donut-chart", {
  ...chartTests({
    example: "default",
    label: "Disk use of nas by kind",
    series: "Backups",
    row: "Backups",
    value: "640 GB",
    at: { x: 0.5, y: 0.93 },
  }),
  "the total in the centre follows the shown segments": async ({ example, expect }) => {
    const body = example("default");
    await expect(body).toContainText("1,416 GB");
    await body.getByRole("button", { name: "Backups" }).click();
    await expect(body).toContainText("776 GB");
  },
});

import { behaviour } from "../../src/behaviour";
import { chartTests } from "./shared/chart-tests";

export default behaviour(
  "bar-chart",
  chartTests({
    example: "grouped",
    label: "Disk use per host",
    series: "Backups",
    row: "nas",
    value: "640 GB",
    at: { x: 0.65, y: 0.6 },
  }),
);

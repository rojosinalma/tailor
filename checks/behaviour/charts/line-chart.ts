import { behaviour } from "../../src/behaviour";
import { chartTests } from "./shared/chart-tests";

export default behaviour(
  "line-chart",
  chartTests({
    example: "several",
    label: "Response time per host, Nov 15, 2026",
    series: "web-2",
    row: "12:00",
    value: "95 ms",
    at: { x: 0.5, y: 0.5 },
  }),
);

import { defineExamples } from "../../examples";
import { BarChart } from "./bar-chart";

const days = ["Nov 9", "Nov 10", "Nov 11", "Nov 12", "Nov 13", "Nov 14", "Nov 15"];

export default defineExamples("bar-chart", [
  {
    id: "default",
    title: "One series",
    render: () => (
      <BarChart
        label="Deploys per day, last 7 days"
        categories={days}
        series={[{ label: "Deploys", values: [3, 5, 2, 7, 4, 1, 2] }]}
      />
    ),
  },
  {
    id: "grouped",
    title: "Several series, grouped",
    note: "A click on a legend item hides or shows its series.",
    render: () => (
      <BarChart
        label="Disk use per host"
        unit="GB"
        categories={["web-1", "web-2", "nas", "db-1"]}
        series={[
          { label: "System", values: [12, 11, 18, 14] },
          { label: "Data", values: [38, 41, 920, 210] },
          { label: "Backups", values: [0, 0, 640, 120] },
        ]}
      />
    ),
  },
  {
    id: "tones",
    title: "Stacked, with tones that carry meaning",
    render: () => (
      <BarChart
        label="Jobs per day by result, last 7 days"
        stacked
        categories={days}
        series={[
          { label: "Passed", values: [42, 48, 39, 51, 47, 22, 25], tone: "success" },
          { label: "Failed", values: [3, 1, 6, 0, 2, 4, 1], tone: "danger" },
        ]}
      />
    ),
  },
  {
    id: "horizontal",
    title: "Sideways, for long category names",
    render: () => (
      <BarChart
        label="Requests per route, Nov 15, 2026"
        horizontal
        categories={["/api/v1/hosts/status", "/api/v1/backups/latest", "/login", "/static/app.js", "/"]}
        series={[{ label: "Requests", values: [18400, 9200, 3100, 22800, 12500] }]}
      />
    ),
  },
  {
    id: "long",
    title: "Long category names, upright",
    render: () => (
      <BarChart
        label="Build time per pipeline stage"
        unit="s"
        categories={[
          "Fetch dependencies from the mirror",
          "Compile the application bundle",
          "Run the unit test suite",
          "Run the browser test suite",
          "Publish the release artefacts",
        ]}
        series={[{ label: "main", values: [38, 124, 61, 240, 22] }]}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <BarChart
        label="Deploys per day by host, last 7 days"
        size="lg"
        categories={days}
        series={[
          { label: "web-1", values: [2, 3, 1, 4, 2, 1, 1] },
          { label: "web-2", values: [1, 2, 1, 3, 2, 0, 1] },
        ]}
      />
    ),
  },
  {
    id: "empty",
    title: "No data",
    render: () => <BarChart label="Deploys per day, web-3" categories={days} series={[]} />,
  },
  {
    id: "target",
    title: "Money, with a reference line",
    note: 'currency="USD" formats the values for the locale ($1,000 in en-US); a line marks what is required per day.',
    render: () => (
      <BarChart
        label="Spend per day, last 7 days"
        currency="USD"
        categories={days}
        series={[{ label: "Spend", values: [820, 1140, 960, 1320, 700, 1010, 1250] }]}
        lines={[{ value: 1000, label: "Required per day", tone: "warning" }]}
      />
    ),
  },
]);

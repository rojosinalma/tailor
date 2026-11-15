import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { LineChart } from "./line-chart";

const hours = [
  "00:00",
  "02:00",
  "04:00",
  "06:00",
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
];
const days = ["Nov 9", "Nov 10", "Nov 11", "Nov 12", "Nov 13", "Nov 14", "Nov 15"];

export default defineExamples("line-chart", [
  {
    id: "default",
    title: "One series",
    render: () => (
      <LineChart
        label="Requests per hour, web-1, Nov 15, 2026"
        categories={hours}
        series={[{ label: "web-1", values: [120, 96, 80, 110, 340, 520, 610, 580, 640, 490, 300, 180] }]}
      />
    ),
  },
  {
    id: "several",
    title: "Several series",
    note: "A click on a legend item hides or shows its series.",
    render: () => (
      <LineChart
        label="Response time per host, Nov 15, 2026"
        unit="ms"
        categories={hours}
        series={[
          { label: "web-1", values: [42, 40, 38, 45, 61, 72, 80, 77, 83, 70, 55, 47] },
          { label: "web-2", values: [50, 48, 47, 52, 70, 88, 95, 90, 99, 84, 66, 58] },
          { label: "nas", values: [12, 12, 30, 14, 15, 16, 18, 17, 16, 15, 14, 13] },
          { label: "db-1", values: [22, 21, 20, 24, 33, 41, 46, 44, 47, 39, 30, 25] },
        ]}
      />
    ),
  },
  {
    id: "area",
    title: "Area, smooth",
    render: () => (
      <LineChart
        label="Traffic of example.com, last 7 days"
        area
        smooth
        unit="GB"
        categories={days}
        series={[
          { label: "In", values: [4.2, 3.8, 5.1, 6.4, 5.9, 2.7, 3.1] },
          { label: "Out", values: [1.4, 1.2, 1.9, 2.2, 2.0, 0.9, 1.1] },
        ]}
      />
    ),
  },
  {
    id: "tones",
    title: "Tones that carry meaning",
    note: "A series with a tone keeps it in every palette; the other series take the next free colour.",
    render: () => (
      <LineChart
        label="Jobs per day by result, last 7 days"
        categories={days}
        series={[
          { label: "Passed", values: [42, 48, 39, 51, 47, 22, 25], tone: "success" },
          { label: "Failed", values: [3, 1, 9, 0, 2, 6, 1], tone: "danger" },
          { label: "Retried", values: [5, 4, 12, 2, 4, 8, 3] },
        ]}
      />
    ),
  },
  {
    id: "stacked",
    title: "Stacked areas",
    render: () => (
      <LineChart
        label="Storage used on nas by share, last 7 days"
        area
        stacked
        unit="TB"
        categories={days}
        series={[
          { label: "media", values: [2.1, 2.1, 2.2, 2.2, 2.3, 2.3, 2.4] },
          { label: "backups", values: [1.2, 1.3, 1.3, 1.4, 1.4, 1.5, 1.5] },
          { label: "home", values: [0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5] },
        ]}
      />
    ),
  },
  {
    id: "bounds",
    title: "Fixed axis, percent",
    render: () => (
      <LineChart
        label="CPU use of nas, Nov 15, 2026"
        unit="%"
        yMin={0}
        yMax={100}
        categories={hours}
        series={[{ label: "CPU", values: [8, 6, 5, 9, 34, 61, 72, 58, 66, 41, 22, 12] }]}
      />
    ),
  },
  {
    id: "long",
    title: "Long category names",
    render: () => (
      <LineChart
        label="Build time per pipeline stage"
        unit="s"
        categories={[
          "Fetch dependencies from the mirror",
          "Compile the application bundle",
          "Run the unit test suite",
          "Run the browser test suite",
          "Publish the release artefacts",
        ]}
        series={[
          { label: "main", values: [38, 124, 61, 240, 22] },
          { label: "release", values: [41, 131, 64, 252, 30] },
        ]}
      />
    ),
  },
  {
    id: "sizes",
    title: "Small and large",
    render: () => (
      <Stack gap="5">
        <LineChart
          label="Requests per hour, web-2, small"
          size="sm"
          categories={hours}
          series={[{ label: "web-2", values: [80, 70, 64, 90, 220, 380, 420, 400, 430, 350, 210, 120] }]}
        />
        <LineChart
          label="Requests per hour, web-2, large"
          size="lg"
          categories={hours}
          series={[{ label: "web-2", values: [80, 70, 64, 90, 220, 380, 420, 400, 430, 350, 210, 120] }]}
        />
      </Stack>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <LineChart
        label="Memory use of web-1 and web-2, Nov 15, 2026"
        unit="GB"
        categories={hours}
        series={[
          { label: "web-1", values: [2.1, 2.1, 2.0, 2.2, 2.9, 3.4, 3.6, 3.5, 3.7, 3.2, 2.6, 2.3] },
          { label: "web-2", values: [1.6, 1.6, 1.5, 1.7, 2.3, 2.8, 3.0, 2.9, 3.1, 2.6, 2.0, 1.8] },
        ]}
      />
    ),
  },
  {
    id: "empty",
    title: "No data",
    render: () => <LineChart label="Requests per hour, web-3" categories={[]} series={[]} />,
  },
]);

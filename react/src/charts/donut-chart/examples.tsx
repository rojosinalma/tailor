import { defineExamples } from "../../examples";
import { DonutChart } from "./donut-chart";

export default defineExamples("donut-chart", [
  {
    id: "default",
    title: "Parts of a whole",
    note: "A click on a legend item hides or shows its segment; the total follows.",
    render: () => (
      <DonutChart
        label="Disk use of nas by kind"
        unit="GB"
        centerLabel="used"
        segments={[
          { label: "Photos", value: 412 },
          { label: "Backups", value: 640 },
          { label: "Video", value: 285 },
          { label: "Documents", value: 48 },
          { label: "Other", value: 31 },
        ]}
      />
    ),
  },
  {
    id: "tones",
    title: "Tones that carry meaning",
    render: () => (
      <DonutChart
        label="Hosts by state"
        centerLabel="hosts"
        segments={[
          { label: "Up", value: 18, tone: "success" },
          { label: "Slow", value: 3, tone: "warning" },
          { label: "Down", value: 1, tone: "danger" },
          { label: "Paused", value: 2, tone: "neutral" },
        ]}
      />
    ),
  },
  {
    id: "one",
    title: "One segment, small",
    render: () => (
      <DonutChart
        label="Backups of web-1"
        size="sm"
        segments={[{ label: "Done", value: 14, tone: "success" }]}
      />
    ),
  },
  {
    id: "long",
    title: "Long segment names, large",
    render: () => (
      <DonutChart
        label="Requests by client"
        size="lg"
        centerLabel="requests"
        segments={[
          { label: "Browsers on desktop computers", value: 51200 },
          { label: "Browsers on phones and tablets", value: 38400 },
          { label: "Command line tools and scripts", value: 9100 },
          { label: "Monitoring probes", value: 4200 },
        ]}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "The legend goes under the ring.",
    width: "sm",
    render: () => (
      <DonutChart
        label="Memory of web-1 by use"
        unit="GB"
        centerLabel="in use"
        segments={[
          { label: "Apps", value: 3.2 },
          { label: "Cache", value: 1.9 },
          { label: "System", value: 0.8 },
        ]}
      />
    ),
  },
  {
    id: "empty",
    title: "No data",
    render: () => <DonutChart label="Disk use of web-3 by kind" segments={[]} />,
  },
]);

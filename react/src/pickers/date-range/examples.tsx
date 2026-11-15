import { defineExamples } from "../../examples";
import { DateRangePicker } from "./date-range";

const presets = [
  { label: "Last 7 days", start: "2026-11-09", end: "2026-11-15" },
  { label: "Last 30 days", start: "2026-10-17", end: "2026-11-15" },
  { label: "This month", start: "2026-11-01", end: "2026-11-30" },
];

export default defineExamples("date-range", [
  {
    id: "default",
    title: "With a placeholder",
    render: () => (
      <DateRangePicker
        nameStart="from"
        nameEnd="to"
        aria-label="Report period"
        placeholder="Pick a report period"
      />
    ),
  },
  {
    id: "value",
    title: "With a value",
    render: () => (
      <DateRangePicker
        nameStart="start"
        nameEnd="end"
        defaultValue={{ start: "2026-11-10", end: "2026-11-20" }}
        aria-label="Maintenance window"
      />
    ),
  },
  {
    id: "presets",
    title: "With presets",
    note: "A preset picks its range at once.",
    render: () => (
      <DateRangePicker nameStart="since" nameEnd="until" presets={presets} aria-label="Log period" />
    ),
  },
  {
    id: "limits",
    title: "Only days between min and max",
    render: () => (
      <DateRangePicker
        nameStart="leave-start"
        nameEnd="leave-end"
        defaultValue={{ start: "2026-11-12", end: "2026-11-14" }}
        min="2026-11-10"
        max="2026-11-25"
        aria-label="Leave"
      />
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <DateRangePicker
        defaultValue={{ start: "2026-11-02", end: "2026-11-06" }}
        disabled
        aria-label="Locked period"
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <DateRangePicker defaultValue={{ start: "2026-11-10", end: "2026-12-02" }} aria-label="Freeze period" />
    ),
  },
]);

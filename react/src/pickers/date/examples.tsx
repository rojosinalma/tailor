import { defineExamples } from "../../examples";
import { DatePicker } from "./date";

export default defineExamples("date", [
  {
    id: "default",
    title: "With a placeholder",
    render: () => <DatePicker name="start" aria-label="Start date" placeholder="Pick a start date" />,
  },
  {
    id: "value",
    title: "With a value",
    render: () => <DatePicker name="due" defaultValue="2026-11-15" aria-label="Due date" />,
  },
  {
    id: "range",
    title: "Only days between min and max",
    note: "Days before min or after max cannot be picked.",
    render: () => (
      <DatePicker defaultValue="2026-11-15" min="2026-11-10" max="2026-11-20" aria-label="Maintenance day" />
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <DatePicker defaultValue="2026-11-15" disabled aria-label="Locked date" />,
  },
]);

import { Cluster } from "../../core/cluster/cluster";
import { defineExamples } from "../../examples";
import { TimePicker } from "./time";

export default defineExamples("time", [
  {
    id: "default",
    title: "With a placeholder",
    render: () => <TimePicker name="backup" aria-label="Backup time" placeholder="Pick a backup time" />,
  },
  {
    id: "value",
    title: "With a value, on a 24-hour clock, in three sizes",
    render: () => (
      <Cluster>
        <TimePicker name="start" defaultValue="14:30" hour12={false} size="sm" aria-label="Small start" />
        <TimePicker name="window" defaultValue="14:30" hour12={false} aria-label="Window start" />
        <TimePicker defaultValue="14:30" hour12={false} size="lg" aria-label="Large start" />
      </Cluster>
    ),
  },
  {
    id: "twelve",
    title: "On a 12-hour clock",
    note: "The locale sets the clock; `hour12` overrides it.",
    render: () => <TimePicker name="alarm" defaultValue="07:15" hour12 aria-label="Alarm" />,
  },
  {
    id: "seconds",
    title: "With seconds",
    render: () => (
      <TimePicker name="offset" defaultValue="00:01:30" seconds hour12={false} aria-label="Offset" />
    ),
  },
  {
    id: "limits",
    title: "Only times between min and max, in steps of 15 minutes",
    note: "Hours and minutes outside the limits cannot be picked.",
    render: () => (
      <TimePicker
        name="slot"
        defaultValue="10:00"
        min="09:00"
        max="17:00"
        step={15}
        hour12={false}
        aria-label="Maintenance slot"
      />
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <TimePicker defaultValue="09:00" hour12={false} disabled aria-label="Locked time" />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <TimePicker defaultValue="23:45" hour12={false} aria-label="Cut-off time" />,
  },
]);

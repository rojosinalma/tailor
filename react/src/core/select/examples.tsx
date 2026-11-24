import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Select } from "./select";

const hosts = [
  { value: "web-1", label: "web-1" },
  { value: "web-2", label: "web-2" },
  { value: "nas", label: "nas" },
  { value: "console", label: "console", disabled: true },
];

/** Time zones, as a settings page lists them: the chosen one sits far down. */
const zones = [
  "Africa/Cairo",
  "Africa/Lagos",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Rome",
  "Pacific/Auckland",
  "UTC",
].map((zone) => ({ value: zone, label: zone }));

export default defineExamples("select", [
  {
    id: "default",
    title: "With a placeholder",
    render: () => <Select options={hosts} name="host" aria-label="Host" placeholder="Pick a host" />,
  },
  {
    id: "value",
    title: "With a value, in three sizes",
    render: () => (
      <Cluster>
        <Select options={hosts} defaultValue="web-2" size="sm" aria-label="Small host" />
        <Select options={hosts} defaultValue="web-2" aria-label="Medium host" />
        <Select options={hosts} defaultValue="web-2" size="lg" aria-label="Large host" />
      </Cluster>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <Select options={hosts} defaultValue="nas" disabled aria-label="Locked host" />,
  },
  {
    id: "long",
    title: "A long list with a value far down",
    note: "The list opens at the chosen value.",
    render: () => <Select options={zones} defaultValue="Pacific/Auckland" aria-label="Time zone" />,
  },
]);

import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Select } from "./select";

const hosts = [
  { value: "web-1", label: "web-1" },
  { value: "web-2", label: "web-2" },
  { value: "nas", label: "nas" },
  { value: "console", label: "console", disabled: true },
];

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
]);

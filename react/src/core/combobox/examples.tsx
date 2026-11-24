import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { Grid } from "../grid/grid";
import { Stack } from "../stack/stack";
import { Combobox } from "./combobox";

const hosts = [
  { value: "web-1", label: "web-1" },
  { value: "web-2", label: "web-2" },
  { value: "nas", label: "nas" },
  { value: "console", label: "console", disabled: true },
];

const many = Array.from({ length: 40 }, (_, i) => {
  const kind = ["web", "db", "cache", "queue"][i % 4] ?? "web";
  const n = Math.floor(i / 4) + 1;
  return { value: `${kind}-${n}`, label: `${kind}-${n}` };
});

const zones = [
  { value: "eu-west", label: "Europe West", description: "Dublin, three zones." },
  { value: "eu-central", label: "Europe Central", description: "Frankfurt, three zones." },
  { value: "us-east", label: "United States East", description: "Virginia, six zones." },
  {
    value: "ap-long",
    label: "Asia Pacific South East with a very long region name that wraps",
    description: "Singapore and Jakarta, with a description that is also long enough to wrap.",
  },
  { value: "sa-east", label: "South America East", description: "Not available yet.", disabled: true },
];

export default defineExamples("combobox", [
  {
    id: "default",
    title: "With a placeholder",
    note: "Type to filter; the arrow keys move, Enter picks, Escape closes and a second Escape clears.",
    render: () => <Combobox options={hosts} name="host" aria-label="Host" placeholder="Pick a host" />,
  },
  {
    id: "value",
    title: "With a value, in three sizes",
    render: () => (
      <Stack>
        <Combobox options={hosts} defaultValue="nas" size="sm" aria-label="Small host" />
        <Combobox options={hosts} defaultValue="nas" name="medium" aria-label="Medium host" />
        <Combobox options={hosts} defaultValue="nas" size="lg" aria-label="Large host" />
      </Stack>
    ),
  },
  {
    id: "many",
    title: "Many options",
    render: () => <Combobox options={many} name="node" aria-label="Node" placeholder="Type a node name" />,
  },
  {
    id: "many-value",
    title: "Many options, with a value far down",
    note: "The list opens at the chosen value, not at the top.",
    render: () => (
      <Combobox options={many} defaultValue="queue-9" name="zone-node" aria-label="Chosen node" />
    ),
  },
  {
    id: "descriptions",
    title: "Descriptions, long labels and a disabled option",
    render: () => <Combobox options={zones} name="zone" aria-label="Region" placeholder="Pick a region" />,
  },
  {
    id: "custom",
    title: "A known value or a new one",
    note: "allowCustom: Enter on text that matches no option keeps that text as the value.",
    render: () => (
      <Combobox
        options={[
          { value: "prod", label: "prod" },
          { value: "staging", label: "staging" },
        ]}
        name="env"
        aria-label="Environment"
        placeholder="Pick or type an environment"
        allowCustom
      />
    ),
  },
  {
    id: "loading",
    title: "While the options load",
    render: () => (
      <Combobox options={[]} loading filter={false} aria-label="Owner" placeholder="Type a user name" />
    ),
  },
  {
    id: "narrow",
    title: "In narrow columns",
    render: () => (
      <Grid min="2xs">
        <Combobox options={zones} defaultValue="ap-long" aria-label="First region" />
        <Combobox options={hosts} defaultValue="web-1" aria-label="First host" />
        <Combobox options={hosts} aria-label="Second host" />
      </Grid>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <Combobox options={hosts} defaultValue="nas" disabled aria-label="Locked host" />,
  },
  {
    id: "field",
    title: "In a field, with an error",
    render: () => (
      <Field label="Backup host" help="Where the nightly copy goes." error="nas is full." required>
        <Combobox options={hosts} defaultValue="nas" name="backup" />
      </Field>
    ),
  },
]);

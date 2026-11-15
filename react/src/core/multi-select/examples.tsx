import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { Grid } from "../grid/grid";
import { MultiSelect } from "./multi-select";

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

const roles = [
  { value: "read", label: "Read", description: "See hosts and logs." },
  { value: "deploy", label: "Deploy", description: "Ship a new version to a host." },
  {
    value: "admin",
    label: "Administer every host, every user and every setting of the whole installation",
    description: "A role with a very long name and a description that is long enough to wrap.",
  },
  { value: "owner", label: "Owner", description: "Only one person holds it.", disabled: true },
];

export default defineExamples("multi-select", [
  {
    id: "default",
    title: "With a placeholder",
    note: "Type to filter; Enter picks and the list stays open. Backspace in the empty input removes the last chip; ArrowLeft reaches the chips.",
    render: () => <MultiSelect options={hosts} name="hosts" aria-label="Hosts" placeholder="Pick hosts" />,
  },
  {
    id: "value",
    title: "With values, in three sizes",
    render: () => (
      <Grid min="sm">
        <MultiSelect options={hosts} defaultValue={["web-1", "nas"]} size="sm" aria-label="Small hosts" />
        <MultiSelect
          options={hosts}
          defaultValue={["web-1", "nas"]}
          name="picked"
          aria-label="Medium hosts"
        />
        <MultiSelect options={hosts} defaultValue={["web-1", "nas"]} size="lg" aria-label="Large hosts" />
      </Grid>
    ),
  },
  {
    id: "many",
    title: "Many options and many chips",
    note: "The box grows in height as the chips wrap.",
    render: () => (
      <MultiSelect
        options={many}
        name="nodes"
        aria-label="Nodes"
        defaultValue={["web-1", "db-1", "cache-1", "queue-1", "web-2", "db-2", "cache-2", "queue-2", "web-3"]}
      />
    ),
  },
  {
    id: "descriptions",
    title: "Descriptions, long labels, a disabled option and at most two",
    render: () => (
      <MultiSelect options={roles} name="roles" aria-label="Roles" placeholder="Pick roles" max={2} />
    ),
  },
  {
    id: "custom",
    title: "Known values or new ones",
    note: "allowCustom: Enter on text that matches no option adds that text as a value.",
    render: () => (
      <MultiSelect
        options={[
          { value: "prod", label: "prod" },
          { value: "staging", label: "staging" },
        ]}
        name="tags"
        aria-label="Tags"
        placeholder="Pick or type tags"
        allowCustom
      />
    ),
  },
  {
    id: "loading",
    title: "While the options load",
    render: () => (
      <MultiSelect options={[]} loading filter={false} aria-label="Owners" placeholder="Type a user name" />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow column",
    render: () => (
      <Grid min="2xs">
        <MultiSelect options={roles} defaultValue={["admin", "read"]} aria-label="Narrow roles" />
      </Grid>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <MultiSelect options={hosts} defaultValue={["nas"]} disabled aria-label="Locked hosts" />,
  },
  {
    id: "field",
    title: "In a field, with an error",
    render: () => (
      <Field label="Notify" help="Each one gets the alert." error="Pick at most three." required>
        <MultiSelect options={hosts} defaultValue={["web-1"]} name="notify" />
      </Field>
    ),
  },
]);

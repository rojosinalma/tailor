import { useState } from "react";
import { Field } from "../../core/field/field";
import { defineExamples } from "../../examples";
import { ListEditor } from "./list-editor";

const regions = [
  { value: "eu", label: "Europe" },
  { value: "us", label: "United States" },
  { value: "ap", label: "Asia Pacific" },
];

const hostName = (item: string): string | undefined =>
  /^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(item) ? undefined : "Use lower-case letters, digits, dots and dashes.";

function Checked() {
  const [hosts, setHosts] = useState<string[]>(["web-1", "web-2"]);
  return (
    <Field label="Allowed hosts" help={`${hosts.length} hosts.`}>
      <ListEditor
        label="Allowed hosts"
        name="hosts"
        value={hosts}
        onValueChange={setHosts}
        validate={hostName}
        placeholder="host.example.com"
      />
    </Field>
  );
}

export default defineExamples("list-editor", [
  {
    id: "default",
    title: "Text rows",
    note: "Move up, move down and remove are buttons, so the list reorders with the keyboard.",
    render: () => (
      <ListEditor
        label="Hosts"
        name="hosts"
        defaultValue={["web-1", "web-2", "nas"]}
        placeholder="Host name"
      />
    ),
  },
  {
    id: "options",
    title: "Known values are picked",
    note: "With options, each row is a select; a value in one row cannot be picked in another.",
    render: () => <ListEditor label="Regions" name="regions" defaultValue={["eu"]} options={regions} />,
  },
  {
    id: "field",
    title: "In a field, with a check of each value",
    note: "The check is a function, so it runs in the React kit only.",
    render: () => <Checked />,
  },
  {
    id: "max",
    title: "At most three rows",
    render: () => (
      <Field label="Tags" help="Up to three tags.">
        <ListEditor label="Tags" name="tags" defaultValue={["backup", "media"]} max={3} placeholder="Tag" />
      </Field>
    ),
  },
  {
    id: "empty",
    title: "Empty",
    render: () => <ListEditor label="Patterns" name="patterns" placeholder="*.log" />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <ListEditor label="Locked hosts" defaultValue={["web-1", "nas"]} disabled />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <Field label="Mirrors">
        <ListEditor
          label="Mirrors"
          name="mirrors"
          defaultValue={["mirror-1.example.com", "a-very-long-mirror-name.downloads.example.com"]}
        />
      </Field>
    ),
  },
]);

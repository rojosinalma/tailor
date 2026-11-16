import { Field } from "../../core/field/field";
import { defineExamples } from "../../examples";
import { KeyValueEditor } from "./key-value-editor";

const env = [
  { key: "PORT", value: "8080" },
  { key: "HOST", value: "web-1.example.com" },
  { key: "DB_PASSWORD", value: "correct-horse" },
];

export default defineExamples("key-value-editor", [
  {
    id: "default",
    title: "Environment variables",
    note: "The value of a key with PASSWORD or TOKEN in it is hidden. Paste KEY=value lines into a key to fill several rows.",
    render: () => (
      <KeyValueEditor
        label="Environment"
        name="env"
        defaultValue={env}
        secretKeys={["PASSWORD", "TOKEN"]}
        keyPlaceholder="NAME"
        valuePlaceholder="value"
      />
    ),
  },
  {
    id: "duplicate",
    title: "A key used twice",
    render: () => (
      <KeyValueEditor
        label="Labels"
        name="labels"
        defaultValue={[
          { key: "team", value: "ops" },
          { key: "zone", value: "eu-1" },
          { key: "team", value: "web" },
        ]}
      />
    ),
  },
  {
    id: "field",
    title: "In a field",
    render: () => (
      <Field label="Labels" help="Labels sort the host in lists and searches.">
        <KeyValueEditor
          label="Labels"
          name="host-labels"
          defaultValue={[{ key: "role", value: "storage" }]}
        />
      </Field>
    ),
  },
  {
    id: "empty",
    title: "Empty",
    render: () => (
      <KeyValueEditor label="Headers" name="headers" keyPlaceholder="Header" valuePlaceholder="Value" />
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <KeyValueEditor label="Locked labels" defaultValue={[{ key: "owner", value: "alice" }]} disabled />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <Field label="Variables">
        <KeyValueEditor
          label="Variables"
          name="vars"
          defaultValue={[
            { key: "BACKUP_TARGET", value: "nas.example.com:/volume1/backups/web-1" },
            { key: "API_TOKEN", value: "abc123" },
          ]}
          secretKeys={["TOKEN"]}
        />
      </Field>
    ),
  },
]);

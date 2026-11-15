import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { Check, CheckGroup } from "./check";

export default defineExamples("check", [
  {
    id: "default",
    title: "Alone",
    render: () => <Check name="terms" value="yes" label="I accept the terms" />,
  },
  {
    id: "states",
    title: "Checked, mixed and disabled",
    render: () => (
      <Stack gap="1">
        <Check label="Checked" defaultChecked />
        <Check label="Mixed" indeterminate />
        <Check label="Disabled" disabled />
        <Check label="Disabled and checked" disabled defaultChecked />
      </Stack>
    ),
  },
  {
    id: "description",
    title: "With a description",
    render: () => (
      <Check
        name="backup"
        label="Back up every night"
        description="Keeps seven daily copies on nas. Older copies are removed."
      />
    ),
  },
  {
    id: "group",
    title: "A group",
    render: () => (
      <CheckGroup label="Protocols" defaultValue={["https"]}>
        <Check name="protocol" value="http" label="HTTP" />
        <Check name="protocol" value="https" label="HTTPS" />
        <Check name="protocol" value="ssh" label="SSH" description="Only from the local network." />
      </CheckGroup>
    ),
  },
  {
    id: "field",
    title: "A group in a field, with an error",
    note: "The field's label names the group; its help and error describe it.",
    render: () => (
      <Field label="Notify by" help="Pick one or more." error="Pick at least one way.">
        <CheckGroup>
          <Check name="notify" value="email" label="Email" />
          <Check name="notify" value="sms" label="Text message" />
        </CheckGroup>
      </Field>
    ),
  },
]);

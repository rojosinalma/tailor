import { defineExamples } from "../../examples";
import { DatePicker } from "../../pickers/date/date";
import { Button } from "../button/button";
import { Check } from "../check/check";
import { Cluster } from "../cluster/cluster";
import { Input } from "../input/input";
import { NumberField } from "../number/number";
import { Select } from "../select/select";
import { Stack } from "../stack/stack";
import { Switch } from "../switch/switch";
import { Textarea } from "../textarea/textarea";
import { Field } from "./field";

const regions = [
  { value: "eu", label: "Europe" },
  { value: "us", label: "United States" },
  { value: "ap", label: "Asia Pacific" },
];

export default defineExamples("field", [
  {
    id: "input",
    title: "A text input with help and an error",
    render: () => (
      <Field
        label="Host name"
        help="Lower-case letters, digits and dashes."
        error="This name is already taken."
        required
      >
        <Input name="host" defaultValue="web-1" />
      </Field>
    ),
  },
  {
    id: "select",
    title: "A select with help and an error",
    render: () => (
      <Field label="Region" help="Where the host runs." error="Pick a region.">
        <Select options={regions} name="region" placeholder="Pick a region" />
      </Field>
    ),
  },
  {
    id: "date",
    title: "A date picker with help and an error",
    render: () => (
      <Field label="Start date" help="The first day of the window." error="The date is in the past.">
        <DatePicker name="start" defaultValue="2026-11-02" />
      </Field>
    ),
  },
  {
    id: "valid",
    title: "Valid, with help only",
    render: () => (
      <Field label="Email" help="Alerts go to this address." required>
        <Input type="email" name="email" placeholder="name@example.com" autoComplete="email" />
      </Field>
    ),
  },
  {
    id: "horizontal",
    title: "Horizontal",
    note: "The label sits beside the control; in a narrow container it stacks above it.",
    render: () => (
      <Stack>
        <Field label="Port" orientation="horizontal" help="Between 1 and 65535.">
          <NumberField name="port" defaultValue={8080} min={1} max={65535} />
        </Field>
        <Field label="Region" orientation="horizontal" error="Pick a region.">
          <Select options={regions} name="region-h" />
        </Field>
      </Stack>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <Field label="Owner" help="Set by the administrator." disabled>
        <Input name="owner" defaultValue="alice" />
      </Field>
    ),
  },
  {
    id: "form",
    title: "A small form",
    note: "A form gets noValidate: the fields draw their errors, the browser shows none.",
    render: () => (
      <form noValidate aria-label="New host">
        <Stack gap="4">
          <Field label="Host name" help="Lower-case letters, digits and dashes." required>
            <Input name="name" autoComplete="off" />
          </Field>
          <Field label="Region" required>
            <Select options={regions} name="region" />
          </Field>
          <Field label="Port" error="The port is in use.">
            <NumberField name="port" defaultValue={80} min={1} max={65535} />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={3} placeholder="What the host is for" />
          </Field>
          <Switch name="monitor" label="Monitor the host" defaultChecked />
          <Check name="backup" label="Back up every night" description="Keeps seven days." />
          <Cluster justify="end">
            <Button type="reset">Reset</Button>
            <Button type="submit" variant="primary">
              Create host
            </Button>
          </Cluster>
        </Stack>
      </form>
    ),
  },
]);

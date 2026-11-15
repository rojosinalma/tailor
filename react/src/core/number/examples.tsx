import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { NumberField } from "./number";

export default defineExamples("number", [
  {
    id: "default",
    title: "Between a min and a max",
    render: () => <NumberField aria-label="Replicas" name="replicas" defaultValue={3} min={1} max={5} />,
  },
  {
    id: "unit",
    title: "With a unit and a step",
    render: () => (
      <NumberField aria-label="Timeout" name="timeout" defaultValue={500} step={100} min={0} unit="ms" />
    ),
  },
  {
    id: "sizes",
    title: "Three sizes",
    render: () => (
      <Stack>
        <NumberField aria-label="Small" size="sm" defaultValue={1} />
        <NumberField aria-label="Medium" defaultValue={2} />
        <NumberField aria-label="Large" size="lg" defaultValue={3} />
      </Stack>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <NumberField aria-label="Locked count" defaultValue={4} disabled />,
  },
  {
    id: "field",
    title: "In a field, with an error",
    render: () => (
      <Field label="Port" help="Between 1 and 65535." error="The port is in use.">
        <NumberField name="port" defaultValue={8080} min={1} max={65535} />
      </Field>
    ),
  },
]);

import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { Textarea } from "./textarea";

export default defineExamples("textarea", [
  {
    id: "default",
    title: "With a placeholder",
    render: () => <Textarea aria-label="Notes" name="notes" placeholder="What the host is for" />,
  },
  {
    id: "auto-grow",
    title: "Grows with the text",
    note: "Where the browser cannot size a field to its content, it keeps its rows.",
    render: () => (
      <Textarea
        aria-label="Description"
        autoGrow
        defaultValue={
          "web-1 serves the public site.\nIt restarts every night at 03:00.\nAsk alice before a change."
        }
      />
    ),
  },
  {
    id: "mono",
    title: "Monospace",
    render: () => (
      <Textarea
        aria-label="Configuration"
        mono
        rows={4}
        defaultValue={'listen: 8080\nhost: "web-1"\nlog: info'}
      />
    ),
  },
  {
    id: "states",
    title: "Read-only and disabled",
    render: () => (
      <Stack>
        <Textarea aria-label="Audit note" readOnly rows={2} defaultValue="Created by alice." />
        <Textarea aria-label="Locked note" disabled rows={2} defaultValue="Managed by the system." />
      </Stack>
    ),
  },
  {
    id: "field",
    title: "In a field, with an error",
    render: () => (
      <Field label="Message" help="Shown on the status page." error="The message is too long." required>
        <Textarea name="message" defaultValue="Planned maintenance on nas tonight." />
      </Field>
    ),
  },
]);

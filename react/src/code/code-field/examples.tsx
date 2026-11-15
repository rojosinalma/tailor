import { useState } from "react";
import { Field } from "../../core/field/field";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { Highlight } from "../highlight/highlight";
import { CodeField } from "./code-field";

const query = `SELECT name, address
FROM hosts
WHERE role = 'web';`;

const env = `TZ=UTC
LOG_LEVEL=info
DATABASE_URL=postgres://app@db.example.com:5432/app`;

const compose = `services:
  web-1:
    image: nginx:1.27
    ports:
      - "8080:80"
    restart: unless-stopped`;

function Controlled() {
  const [value, setValue] = useState(query);
  return (
    <Stack>
      <CodeField language="sql" value={value} onValueChange={setValue} label="Query" lineNumbers />
      <Highlight language="text" title="Value" code={`${value.length} characters`} wrap />
    </Stack>
  );
}

export default defineExamples("code-field", [
  {
    id: "sql",
    title: "A query",
    note: "Tab indents; Escape, then Tab, leaves the field.",
    render: () => <CodeField language="sql" defaultValue={query} label="Query" name="query" />,
  },
  {
    id: "line-numbers",
    title: "Line numbers",
    render: () => <CodeField language="yaml" defaultValue={compose} label="Compose file" lineNumbers />,
  },
  {
    id: "grow",
    title: "Grows up to a height, then scrolls",
    note: "Two rows at least, five at most.",
    render: () => (
      <CodeField language="ini" defaultValue={env} rows={2} maxRows={5} label="Environment" lineNumbers />
    ),
  },
  {
    id: "placeholder",
    title: "Empty, with a placeholder",
    render: () => <CodeField language="ini" placeholder="KEY=value" label="Environment" />,
  },
  {
    id: "controlled",
    title: "Controlled",
    render: () => <Controlled />,
  },
  {
    id: "field",
    title: "In a field, with help and an error",
    render: () => (
      <Field
        label="Health query"
        help="Runs every minute against the hosts table."
        error="The query must name a table."
        required
        name="health"
      >
        <CodeField language="sql" defaultValue="SELECT count(*)" lineNumbers />
      </Field>
    ),
  },
  {
    id: "invalid",
    title: "Invalid",
    render: () => <CodeField language="sql" defaultValue="SELEC name FROM hosts" label="Query" invalid />,
  },
  {
    id: "read-only",
    title: "Read only",
    render: () => <CodeField language="ini" defaultValue={env} label="Environment" readOnly />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <CodeField language="sql" defaultValue={query} label="Query" disabled />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <CodeField language="ini" defaultValue={env} label="Environment" lineNumbers />,
  },
]);

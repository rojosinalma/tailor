import { search } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { Input } from "./input";

export default defineExamples("input", [
  {
    id: "default",
    title: "With a placeholder",
    render: () => <Input aria-label="Host name" name="host" placeholder="web-1" />,
  },
  {
    id: "sizes",
    title: "Three sizes",
    render: () => (
      <Stack>
        <Input size="sm" aria-label="Small" defaultValue="web-1" />
        <Input aria-label="Medium" defaultValue="web-1" />
        <Input size="lg" aria-label="Large" defaultValue="web-1" />
      </Stack>
    ),
  },
  {
    id: "types",
    title: "Types",
    render: () => (
      <Stack>
        <Input type="email" aria-label="Email" placeholder="name@example.com" autoComplete="email" />
        <Input type="url" aria-label="Address" placeholder="https://example.com" inputMode="url" />
        <Input type="tel" aria-label="Phone" placeholder="+1 555 0100" autoComplete="tel" />
        <Input type="password" aria-label="Password" autoComplete="current-password" />
      </Stack>
    ),
  },
  {
    id: "group",
    title: "With something before or after the text",
    render: () => (
      <Stack>
        <Input aria-label="Filter hosts" before={<Glyph body={search} />} placeholder="Filter" />
        <Input aria-label="Site" before="https://" after=".example.com" placeholder="docs" />
        <Input aria-label="Timeout" after="seconds" defaultValue="30" inputMode="numeric" size="sm" />
      </Stack>
    ),
  },
  {
    id: "states",
    title: "Read-only and disabled",
    render: () => (
      <Stack>
        <Input aria-label="Host id" defaultValue="h-4f2a9c" readOnly />
        <Input aria-label="Locked host" defaultValue="nas" disabled />
        <Input aria-label="Locked site" before="https://" defaultValue="example.com" disabled />
      </Stack>
    ),
  },
  {
    id: "long",
    title: "A long value",
    render: () => (
      <Input
        aria-label="Path"
        defaultValue="/srv/data/backups/web-1/2026/11/15/full-snapshot-with-a-very-long-name.tar.zst"
      />
    ),
  },
  {
    id: "pattern",
    title: "A pattern",
    note: "The value must match the pattern; in a form, a value that does not shows the pattern message. The help says the format.",
    render: () => (
      <Field label="Host name" help="Lower-case letters, digits and dashes.">
        <Input name="host" pattern="[a-z0-9\-]+" defaultValue="web-1" autoComplete="off" />
      </Field>
    ),
  },
  {
    id: "field",
    title: "In a field, with an error",
    render: () => (
      <Field label="Domain" help="Without https://." error="This is not a domain name.">
        <Input before="https://" defaultValue="example" name="domain" />
      </Field>
    ),
  },
]);

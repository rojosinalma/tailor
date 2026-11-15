import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { Secret } from "./secret";

export default defineExamples("secret", [
  {
    id: "default",
    title: "With reveal and copy",
    render: () => <Secret aria-label="API token" name="token" defaultValue="tok_4f2a9c81e7d3" copyable />,
  },
  {
    id: "password",
    title: "A new password",
    render: () => <Secret aria-label="New password" name="password" autoComplete="new-password" />,
  },
  {
    id: "states",
    title: "Sizes, read-only and disabled",
    render: () => (
      <Stack>
        <Secret aria-label="Small secret" size="sm" defaultValue="tok_small" />
        <Secret aria-label="Large secret" size="lg" defaultValue="tok_large" />
        <Secret aria-label="Read-only token" defaultValue="tok_readonly" readOnly copyable />
        <Secret aria-label="Locked token" defaultValue="tok_locked" disabled />
      </Stack>
    ),
  },
  {
    id: "field",
    title: "In a field, with an error",
    render: () => (
      <Field label="Password" help="At least 12 characters." error="The password is too short." required>
        <Secret name="pw" defaultValue="short" autoComplete="current-password" />
      </Field>
    ),
  },
]);

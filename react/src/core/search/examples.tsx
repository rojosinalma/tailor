import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { Search } from "./search";

export default defineExamples("search", [
  {
    id: "default",
    title: "With the / shortcut",
    note: "Press / to focus it. Escape clears the text, or leaves the field when it is empty.",
    render: () => <Search label="Search hosts" name="q" />,
  },
  {
    id: "value",
    title: "With text, in three sizes",
    render: () => (
      <Stack>
        <Search label="Small search" size="sm" defaultValue="web" shortcut={false} />
        <Search label="Medium search" defaultValue="web" shortcut={false} />
        <Search label="Large search" size="lg" defaultValue="web" shortcut={false} />
      </Stack>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <Search label="Locked search" disabled shortcut={false} />,
  },
  {
    id: "field",
    title: "In a field, with help",
    render: () => (
      <Field label="Find a user" help="By name or email." error="No user matches alice2.">
        <Search label="Find a user" defaultValue="alice2" shortcut={false} placeholder="alice" />
      </Field>
    ),
  },
]);

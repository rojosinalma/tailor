import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { Kbd } from "./kbd";

export default defineExamples("kbd", [
  {
    id: "keys",
    title: "Keys in text",
    render: () => (
      <Stack gap="2">
        <span>
          Press <Kbd>Esc</Kbd> to close the dialog.
        </span>
        <span>
          Press <Kbd keys={["Ctrl", "K"]} /> to search, or <Kbd keys={["Ctrl", "Shift", "P"]} /> for the
          commands.
        </span>
        <span>
          Move with <Kbd>↑</Kbd> and <Kbd>↓</Kbd>, pick with <Kbd>Enter</Kbd>.
        </span>
      </Stack>
    ),
  },
]);

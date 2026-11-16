import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "list-editor",
  name: "List editor",
  pack: "forms",
  group: "inputs",
  description:
    "Edits a list of values (hosts, patterns, tags) as rows: a text input, or a select when the values are known, with move up, move down and remove buttons, and an Add button. The HTML kit upgrades a textarea with one value per line.",
  root: "t-list-editor",
  parts: {
    "t-list-editor-list": "the list of rows",
    "t-list-editor-row": "one value with its buttons",
    "t-list-editor-item": "the control of one row",
    "t-list-editor-error": "the error text of one row",
  },
  html: "script",
});

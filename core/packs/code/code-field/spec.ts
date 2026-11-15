import { defineComponent } from "@tailor/core/spec";
import { LANGUAGES } from "../highlight/spec";

export default defineComponent({
  id: "code-field",
  name: "Code field",
  pack: "code",
  group: "inputs",
  description:
    "A small editor for short code or config, such as a query or a few env lines: monospace, coloured, Tab indents. It grows with its lines up to a height, then scrolls, and takes its label and messages from a Field.",
  root: "t-code-field",
  parts: {
    "t-code-field-gutter": "the column of line numbers, left out of a selection",
    "t-code-field-numbers": "the numbers, which scroll with the text",
    "t-code-field-editor": "the stack of the colour layer and the text area",
    "t-code-field-colour": "the coloured copy of the text, behind the text area",
    "t-code-field-input": "the text area with transparent text, which holds the value",
  },
  props: {
    language: ["auto", "text", ...LANGUAGES],
    value: [],
    defaultValue: [],
    name: [],
    rows: [],
    maxRows: [],
    placeholder: [],
    label: [],
    lineNumbers: ["true"],
    disabled: ["true"],
    readOnly: ["true"],
    required: ["true"],
    invalid: ["true"],
  },
  html: "none",
});

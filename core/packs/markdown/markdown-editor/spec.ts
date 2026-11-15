import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "markdown-editor",
  name: "Markdown editor",
  pack: "markdown",
  group: "inputs",
  description:
    'A Markdown text field with a formatting toolbar and a preview: "Write" and "Preview" tabs, or both side by side in a wide container with mode="split".',
  root: "t-md-editor",
  parts: {
    "t-md-editor-write": "the toolbar and the text area",
    "t-md-editor-toolbar": "the formatting buttons; Ctrl/Cmd+B, I and K do bold, italic and link",
    "t-md-editor-split": "the two panes side by side, in split mode on a wide container",
    "t-md-editor-preview": "the rendered preview",
    "t-md-editor-empty": "the note in an empty preview",
  },
  props: { mode: ["tabs", "split"], rows: [], placeholder: [], label: [] },
  html: "none",
});

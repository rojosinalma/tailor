import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "markdown",
  name: "Markdown",
  pack: "markdown",
  group: "display",
  description:
    "Renders a Markdown string (GitHub flavour) as prose. The HTML is always cleaned before it reaches the page: no scripts, event handlers, inline styles or embedded frames.",
  root: "t-markdown",
  parts: {
    "t-markdown-task": "a task list item",
    "t-markdown-check": "the label of a task: the read-only check box and the text",
    "t-markdown-box": "the drawn check box of a task",
  },
  props: { source: [], label: [] },
  html: "script",
});

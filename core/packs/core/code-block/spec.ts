import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "code-block",
  name: "Code block",
  pack: "core",
  group: "display",
  description:
    "Preformatted code with a copy button. Long lines scroll sideways inside the block, or wrap with `wrap`.",
  root: "t-code",
  parts: {
    "t-code-header": "the row above the code: the title and the copy button",
    "t-code-title": "the title, such as a file name",
    "t-code-copy": "the copy button; it shows a check for a moment after copying",
    "t-code-pre": "the <pre><code> that holds the code; it takes the focus so the keyboard can scroll it",
  },
  props: { code: [], title: [], label: [], wrap: ["true"] },
  html: "script",
});

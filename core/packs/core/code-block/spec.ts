import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "code-block",
  name: "Code block",
  pack: "core",
  group: "display",
  description:
    "Preformatted code with a copy button. With a title, a header bar holds it and the button; without one, there is no bar and an icon-only copy button sits at the top end corner over the code. Long lines scroll sideways inside the block, or wrap with `wrap`.",
  root: "t-code",
  parts: {
    "t-code-header": "the row above the code, only with a title: the title and the copy button",
    "t-code-title": "the title, such as a file name",
    "t-code-corner": "without a title: holds the copy button at the top end corner, over the code",
    "t-code-copy":
      "the copy button; it shows a check for a moment after copying; without a title it is icon-only, over the code",
    "t-code-pre": "the <pre><code> that holds the code; it takes the focus so the keyboard can scroll it",
  },
  props: { code: [], title: [], label: [], wrap: ["true"] },
  html: "script",
});

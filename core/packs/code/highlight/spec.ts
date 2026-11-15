import { defineComponent } from "@tailor/core/spec";

/** The languages that the kits colour. "auto" guesses among them, "text" leaves the code plain. */
export const LANGUAGES = [
  "bash",
  "css",
  "diff",
  "dockerfile",
  "go",
  "ini",
  "javascript",
  "json",
  "markdown",
  "python",
  "ruby",
  "rust",
  "sql",
  "typescript",
  "xml",
  "yaml",
] as const;

export default defineComponent({
  id: "highlight",
  name: "Highlight",
  pack: "code",
  group: "display",
  description:
    "A code block with syntax colours that follow the palette. Same header, copy button, scrolling and wrapping as the code block.",
  root: "t-highlight",
  parts: {
    "t-code": "the block, from the code block; the root carries both classes",
    "t-highlight-line": "one line of code, when the block shows line numbers",
  },
  props: {
    code: [],
    language: ["auto", "text", ...LANGUAGES],
    title: [],
    label: [],
    wrap: ["true"],
    lineNumbers: ["true"],
  },
  html: "script",
});

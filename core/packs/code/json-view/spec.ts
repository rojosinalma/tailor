import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "json-view",
  name: "JSON view",
  pack: "code",
  group: "display",
  description:
    "A JSON value as a tree that folds, with the syntax colours of the highlight and a copy button. A closed node shows how many entries it holds.",
  root: "t-json",
  parts: {
    "t-code": "the block, from the code block; the root carries both classes",
    "t-json-tree": "the tree: one tab stop, the arrow keys move, open and close",
    "t-json-item": "the line of one entry, a tree item: the toggle, the key and the value",
    "t-json-toggle": "the arrow of an entry that opens",
    "t-json-index": "the index of an array entry",
    "t-json-count": "the summary of an object or an array, such as { 12 keys }",
    "t-json-group": "the entries of an open object or array, next to its item and owned by it",
  },
  props: { value: [], label: [], defaultExpandDepth: [] },
  html: "none",
});

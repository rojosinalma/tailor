import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "diff-view",
  name: "Diff view",
  pack: "code",
  group: "display",
  description:
    "The difference between two texts, or a ready unified diff: numbered lines with + and − signs, unified or side by side. Side by side falls back to unified in a narrow box.",
  root: "t-diff",
  parts: {
    "t-code": "the block, from the code block; the root carries both classes",
    "t-diff-body": "the lines; it scrolls sideways and takes the focus for that",
    "t-diff-lines": "one layout of the lines, unified or split (data-layout)",
    "t-diff-hunk": "the header of a hunk, with the file name when the diff holds more than one",
    "t-diff-row": "one row of the split layout: the old line and the new one",
    "t-diff-line": "one line, with data-change add, remove or context",
    "t-diff-num": "a line number, left out of a selection",
    "t-diff-sign": "the + or − sign of a changed line",
    "t-diff-text": "the text of the line",
    "t-diff-empty": "the text shown when nothing changed",
  },
  props: {
    before: [],
    after: [],
    patch: [],
    mode: ["unified", "split"],
    title: [],
    context: [],
  },
  html: "none",
});

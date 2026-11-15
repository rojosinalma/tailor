import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "split",
  name: "Split",
  pack: "core",
  group: "layout",
  description:
    "Two panes with a handle between them that the user drags or moves with the arrow keys. In a narrow space a row split stacks its panes.",
  root: "t-split",
  parts: {
    "t-split-pane": "one of the two panes; it scrolls alone",
    "t-split-handle": "the separator between the panes, focusable",
  },
  props: {
    direction: ["row", "column"],
    defaultSize: [],
    min: [],
    max: [],
    storageKey: [],
    label: [],
    first: [],
    second: [],
  },
  html: "script",
});

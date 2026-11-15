import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "separator",
  name: "Separator",
  pack: "core",
  group: "display",
  description:
    "A line between groups, across or upright, with an optional label in the middle. A decorative line is hidden from screen readers.",
  root: "t-separator",
  parts: { "t-separator-label": "the text in the middle of an across line" },
  props: { orientation: ["horizontal", "vertical"], decorative: ["true"] },
  html: "markup",
});

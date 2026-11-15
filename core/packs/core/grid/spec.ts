import { defineComponent, GAPS } from "@tailor/core/spec";

export default defineComponent({
  id: "grid",
  name: "Grid",
  pack: "core",
  group: "layout",
  description:
    "Equal columns that fill the row and wrap, each at least the min width; the children in a row have equal height.",
  root: "t-grid",
  props: {
    min: ["2xs", "xs", "sm", "md"],
    gap: GAPS,
  },
  html: "markup",
});

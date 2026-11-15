import { defineComponent, GAPS } from "@tailor/core/spec";

export default defineComponent({
  id: "stack",
  name: "Stack",
  pack: "core",
  group: "layout",
  description: "Puts its children in a column with one gap between them.",
  root: "t-stack",
  props: {
    gap: GAPS,
    align: ["start", "center", "end", "stretch"],
  },
  html: "markup",
});

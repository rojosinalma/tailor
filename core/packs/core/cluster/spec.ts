import { defineComponent, GAPS } from "@tailor/core/spec";

export default defineComponent({
  id: "cluster",
  name: "Cluster",
  pack: "core",
  group: "layout",
  description: "Puts its children in a row that wraps, with one gap between them.",
  root: "t-cluster",
  props: {
    gap: GAPS,
    align: ["start", "center", "end", "stretch", "baseline"],
    justify: ["start", "center", "end", "between"],
  },
  html: "markup",
});

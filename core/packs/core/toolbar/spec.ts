import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "toolbar",
  name: "Toolbar",
  pack: "core",
  group: "layout",
  description:
    "One row of controls above content: filters at the start, actions at the end. In a narrow space the end group goes under the start group.",
  root: "t-toolbar",
  parts: {
    "t-toolbar-start": "filters and search",
    "t-toolbar-end": "actions",
  },
  props: { start: [], end: [] },
  html: "markup",
});

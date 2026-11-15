import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "pane",
  name: "Pane",
  pack: "core",
  group: "layout",
  description:
    "A box with a fixed header and a body that scrolls. It fills the height of its parent: use it in a fill page, a split or a list-detail.",
  root: "t-pane",
  parts: {
    "t-pane-header": "the title row",
    "t-pane-title": "the title",
    "t-pane-actions": "the pane actions, at the end",
    "t-pane-body": "the content, which scrolls; data-padding=none for tables and lists",
    "t-pane-footer": "an optional row at the bottom",
  },
  props: { title: [], actions: [], footer: [], label: [], padding: ["default", "none"] },
  html: "markup",
});

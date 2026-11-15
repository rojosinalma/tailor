import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "section",
  name: "Section",
  pack: "core",
  group: "layout",
  description: "A titled block inside a page, with optional actions at the end of its header.",
  root: "t-section",
  parts: {
    "t-section-header": "the title row",
    "t-section-heading": "holds the title and the description",
    "t-section-title": "the h2",
    "t-section-description": "one line under the title",
    "t-section-actions": "the section actions, at the end",
    "t-section-body": "the content, a column",
  },
  props: { title: [], description: [], actions: [] },
  html: "markup",
});

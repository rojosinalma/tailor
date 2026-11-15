import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "page",
  name: "Page",
  pack: "core",
  group: "layout",
  description:
    "Fills the content region of a shell: a pinned header with the one h1, and a body that scrolls or fills.",
  root: "t-page",
  parts: {
    "t-page-header": "the title row, pinned at the top",
    "t-page-breadcrumb": "holds the breadcrumb, above the title",
    "t-page-heading": "holds the title and the description",
    "t-page-title": "the one h1 of the page",
    "t-page-description": "one line under the title",
    "t-page-actions": "the page actions, at the end; under the title in a narrow page",
    "t-page-body": "the content: scrolls (mode scroll) or takes the free height (mode fill)",
  },
  props: {
    title: [],
    description: [],
    breadcrumb: [],
    actions: [],
    mode: ["scroll", "fill"],
    width: ["full", "readable"],
  },
  html: "markup",
});

import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "loading-page",
  name: "Loading page",
  pack: "core",
  group: "pages",
  description:
    "The pending state of a page: a centred spinner with a text, or the skeleton of a page. It shows only after a short delay, so a fast load never flashes. `routePendingComponent` wires it into a router.",
  root: "t-loading-page",
  parts: {
    "t-loading-page-spinner": "the spinner and its text",
    "t-loading-page-label": "the visible text under the spinner, the page's h1",
    "t-loading-page-skeleton": "the placeholder of a page: a title, a toolbar and rows",
  },
  props: {
    variant: ["spinner", "skeleton"],
    /** Milliseconds before the page shows. */
    delay: ["0", "150", "500", "1000"],
  },
  html: "markup",
});

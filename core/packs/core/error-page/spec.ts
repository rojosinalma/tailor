import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "error-page",
  name: "Error page",
  pack: "core",
  group: "pages",
  description:
    "The page for a failure: a title, one sentence, Try again and Home, and the error in a closed Details section. `routeErrorComponent` makes it a route error boundary. In the HTML kit Try again reloads the page.",
  root: "t-status-page",
  parts: { "t-status-page-details": "the closed section that holds the error message or a reference" },
  props: { title: [], text: [], homeTo: [], details: [], detailsOpen: [] },
  html: "script",
});

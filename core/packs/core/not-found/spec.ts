import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "not-found",
  name: "Not found page",
  pack: "core",
  group: "pages",
  description:
    "The page for an address that matches nothing: a title, one sentence and a link home. It fills its parent and centres its content. `routeNotFoundComponent` wires it into a router.",
  root: "t-status-page",
  parts: {
    "t-status-page-body": "the centred column",
    "t-status-page-code": "a large, quiet code such as 404, for looks only",
    "t-status-page-icon": "a large, quiet glyph above the title",
    "t-status-page-title": "the one h1 of the page",
    "t-status-page-text": "one sentence under the title",
    "t-status-page-actions": "the buttons and links",
  },
  props: { title: [], text: [], homeTo: [] },
  html: "markup",
});

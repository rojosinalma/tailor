import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "page",
  name: "Page",
  pack: "core",
  group: "layout",
  description:
    'Fills the content region of a shell: a pinned header with the one h1 (and the state of the record beside it), and a body that scrolls or fills. width="readable" caps the header and the body at a width that reads well.',
  root: "t-page",
  parts: {
    "t-page-header": "the title row, pinned at the top",
    "t-page-breadcrumb": "holds the breadcrumb, above the title",
    "t-page-heading": "holds the title and the description",
    "t-page-title": "the one h1 of the page",
    "t-page-title-row": "the title with the status beside it, when the page has a status",
    "t-page-status": "the state of the record beside the title, usually a StateLabel",
    "t-page-description": "one line under the title",
    "t-page-actions": "the page actions, at the end; under the title in a narrow page",
    "t-page-secondary": "the other actions as buttons, in a page of at least 40rem",
    "t-page-more": "the other actions as one menu, in a narrower page",
    "t-page-body": "the content: scrolls (mode scroll) or takes the free height (mode fill)",
  },
  props: {
    title: [],
    status: [],
    description: [],
    breadcrumb: [],
    actions: [],
    primaryAction: [],
    moreActions: [],
    mode: ["scroll", "fill"],
    width: ["full", "readable"],
  },
  html: "markup",
});

import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "breadcrumb",
  name: "Breadcrumb",
  pack: "core",
  group: "navigation",
  description:
    "Shows where the page sits: links to the pages above it and the current page as text. In a narrow container only the first item, an ellipsis and the last two show.",
  root: "t-breadcrumb",
  parts: {
    "t-breadcrumb-list": "the <ol> of items",
    "t-breadcrumb-item": 'one item: a link, or the current page as text with aria-current="page"',
    "t-breadcrumb-more": "the ellipsis that stands for the hidden middle items in a narrow container",
  },
  html: "markup",
});

import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "pagination",
  name: "Pagination",
  pack: "core",
  group: "navigation",
  description:
    'Moves through the pages of a list: previous, next and the page numbers around the current one. In a narrow container only previous, "Page N of M" and next show.',
  root: "t-pagination",
  parts: {
    "t-pagination-list": "the row of items",
    "t-pagination-step": "the previous or the next button or link",
    "t-pagination-page": 'one page number; the current one has aria-current="page"',
    "t-pagination-gap": "the ellipsis that stands for hidden pages",
    "t-pagination-status": 'the "Page N of M" text of the narrow form',
  },
  html: "markup",
});

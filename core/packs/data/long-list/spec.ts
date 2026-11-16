import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "long-list",
  name: "Long list",
  pack: "data",
  group: "display",
  description:
    "A list of very many rows that stays fast: only the rows in view are in the page. It scrolls in its own box and fills its parent, for fill-mode pages and panes. React only: the HTML kit shows long lists in pages with pagination.",
  root: "t-long-list",
  parts: {
    "t-long-list-inner":
      "the list (ul), as tall as all rows together; the rows above the view are space at its top",
    "t-long-list-item": "one row",
    "t-long-list-more": "the spinner row at the end while more rows load",
  },
  html: "none",
});

import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "list-page",
  name: "List page",
  pack: "layouts",
  group: "layouts",
  description:
    'The page for a list of records, to copy: a Page with the title, one primary action and the others in a menu, then a DataTable with a search, a status filter, sortable columns, a row menu, selection with bulk actions and pages. Below 40rem the rows become cards with a "Sort by" control, and a filter that matches nothing shows "No matches" with Clear filters.',
  root: "t-page",
  html: "markup",
});

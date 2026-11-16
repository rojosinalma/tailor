import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "data-table",
  name: "Data table",
  pack: "data",
  group: "display",
  description:
    'A table for many rows: sorting, a search, column filters, pages, row selection with bulk actions and column visibility. It looks like the plain table and follows its narrow forms. HTML kit: a server-rendered t-table inside <div class="t-data-table" data-t="data-table" data-page-size="20">; th carry data-sort, data-filter and data-priority, cells may carry data-value, rows data-row-id; data-selectable adds the boxes and fires t:selection with the ids; buttons in a [data-t-bulk] slot show while rows are selected and fire t:bulk. Without the script the full table shows.',
  root: "t-data-table",
  parts: {
    "t-data-table-sort": "the button in a sortable th; the th carries aria-sort",
    "t-data-table-check": "the cell that holds the box of a row or of the page",
    "t-data-table-sortby": "the Sort by control in the toolbar, shown only while the rows are cards",
    "t-data-table-selection": "the selected count, the bulk actions and the clear button in the toolbar",
    "t-data-table-footer": "the row under the table: the count, the pages and the rows per page",
    "t-data-table-count": "the count text: 21–40 of 312",
    "t-data-table-size": "the rows-per-page control",
  },
  props: {
    density: ["default", "compact"],
    narrow: ["cards", "scroll"],
    /** On a th of the HTML kit: how the column sorts. */
    sort: ["text", "num", "date"],
    /** On a th of the HTML kit: a filter from the values of the column, or a text filter. */
    filter: ["select", "text"],
  },
  html: "script",
});
